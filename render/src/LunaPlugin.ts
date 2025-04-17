import quartz from "@uwu/quartz";

// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import { Semaphore, setDefaults, Signal } from "@inrixia/helpers";
import { storage } from "./core/storage.js";
import { unloadSet, type LunaUnload } from "./helpers/unloadSet.js";
import { lTrace } from "./index.js";

type ModuleExports = {
	unloads?: Set<LunaUnload>;
	onUnload?: LunaUnload;
	Settings?: React.FC;
	errSignal?: Signal<string | undefined>;
};

interface LunaPluginConfig {
	enabled: boolean;
	liveReload: boolean;
}

interface LunaPluginStorage extends LunaPluginConfig {
	code?: string;
	info?: LunaPluginInfo;
}

export type LunaAuthor = {
	name: string;
	url: string;
	avatarUrl?: string;
};
export type LunaPluginInfo = {
	author: LunaAuthor;
	name: string;
	hash: string;
	description?: React.ReactNode;
	version?: string;
	dependencies?: string[];
	devDependencies?: string[];
};
export class LunaPlugin {
	// #region Static
	static {
		// Ensure all plugins are unloaded on beforeunload
		addEventListener("beforeunload", () => {
			for (const plugin of Object.values(LunaPlugin.plugins)) {
				plugin.unload().catch((err) => {
					const errMsg = `[Luna] Failed to unload plugin ${plugin.name}! Please report this to the Luna devs. ${err?.message}`;
					// Use alert here over logErr as Tidal may be partially unloaded
					alert(errMsg);
					console.error(errMsg, err);
				});
			}
		});
	}

	public static readonly pluginStore = (storage["__plugins"] ??= {});
	public static readonly plugins: Record<string, LunaPlugin> = {};
	public static fromUri(uri: string, defaults: Partial<LunaPluginConfig> = {}) {
		defaults.enabled ??= false;
		defaults.liveReload ??= false;

		return (this.plugins[uri] ??= new this(uri, <LunaPluginConfig>defaults));
	}
	// #endregion

	// #region constructor
	private constructor(
		public readonly url: string,
		defaults: LunaPluginConfig,
	) {
		// Apply defaults and/or create store
		this._store = setDefaults<LunaPluginConfig>((LunaPlugin.pluginStore[this.url] ??= defaults), defaults);

		// Enabled has to be setup first because liveReload below accesses it
		this._enabled = new Signal(this._store.enabled);
		this._enabled.onValue((next) => {
			// Protect against disabling permanantly in the background if loading causes a error
			// Restarting the client will attempt to load again
			if (this.loadError._ === undefined) this._store.enabled = next;
		});
		// Allow other code to listen to onEnabled (this._enabled is private)
		this.onEnabled = this._enabled.onValue.bind(this._enabled);

		this.liveReload = new Signal(this._store.liveReload);
		this.liveReload.onValue((next) => {
			if ((this._store.liveReload = next)) this.startReloadLoop();
			else this.stopReloadLoop();
		});

		if (this.enabled) this.enable();
	}
	// #endregion

	// #region reloadLoop
	private _reloadTimeout?: NodeJS.Timeout;
	private startReloadLoop() {
		if (this._reloadTimeout) return;
		const reloadLoop = async () => {
			// Fail quietly
			await this.loadExports().catch(() => {});
			// Dont continue to loop if disabled or liveReload is false
			if (!this.enabled || !this.liveReload._) return;
			this._reloadTimeout = setTimeout(reloadLoop.bind(this), 1000);
		};
		// Immediately set reloadTimeout to avoid entering this multiple times
		this._reloadTimeout = setTimeout(reloadLoop);
	}
	private stopReloadLoop() {
		clearTimeout(this._reloadTimeout);
		this._reloadTimeout = undefined;
	}
	// #endregion

	// #region Signals
	public readonly loading: Signal<boolean> = new Signal(false);
	public readonly fetching: Signal<boolean> = new Signal(false);
	public readonly loadError: Signal<string> = new Signal(undefined);
	public Settings: Signal<React.FC> = new Signal(this._exports?.Settings);

	public readonly liveReload: Signal<boolean>;
	private readonly _enabled: Signal<boolean>;

	public onEnabled;
	public get enabled() {
		return this._enabled._;
	}
	// #endregion

	// #region _exports
	private readonly _exports?: ModuleExports;
	private get exports() {
		return this._exports;
	}
	private set exports(exports: ModuleExports | undefined) {
		if (this._unloads.size !== 0) {
			// If we always unload on load then we should never be here
			lTrace.msg.warn(`Plugin ${this.name} is trying to set exports but unloads are not empty! Please report this to the Luna devs.`);
			// This is a safety check to ensure we dont leak unloads
			// If there is somehow leftover unloads we need to add them to the new exports.unloads if it exists
			if (exports?.unloads !== undefined) {
				for (const unload of this._unloads) exports.unloads.add(unload);
				this._unloads.clear();
			}
		}
		// Cast to set, _exports is readonly to avoid accidental internal modification
		(<ModuleExports | undefined>this._exports) = exports;
		// Ensure Settings signal is triggered on exports changing
		this.Settings._ = exports?.Settings;
	}
	private readonly _unloads: Set<LunaUnload> = new Set();
	private get unloads() {
		return this._exports?.unloads ?? this._unloads;
	}
	// #endregion

	// #region _store
	private readonly _store: LunaPluginStorage;
	private get code() {
		return this._store.code;
	}
	private set code(value) {
		this._store.code = value;
	}
	private get hash() {
		return this._store.info?.hash;
	}
	public get name() {
		return this._store.info?.name;
	}
	// #endregion

	// #region dis/enable, re/unload
	/**
	 * Are you sure you didnt mean disable() or reload()?
	 * This will unload the plugin without disabling it!
	 */
	private async unload(): Promise<void> {
		try {
			this.loading._ = true;
			await unloadSet(this.exports?.unloads);
		} finally {
			this.exports = undefined;
			this.loading._ = false;
		}
	}
	public async enable() {
		await this.loadExports(true);
		this._enabled._ = true;
		// Ensure live reload is running it it should be
		if (this.liveReload._) this.startReloadLoop();
	}
	public async disable() {
		// Disable the reload loop
		this.stopReloadLoop();
		await this.unload();
		this._enabled._ = false;
		this.loadError._ = undefined;
	}
	public async reload() {
		await this.disable();
		await this.enable();
	}
	// #endregion

	// #region Fetch
	/**
	 * Returns true if code changed
	 */
	private async fetchNewInfo(): Promise<boolean> {
		try {
			this.fetching._ = true;
			const newInfo = await fetch(`${this.url}.json`).then((res) => res.json() as Promise<LunaPluginInfo>);
			if (this.hash !== newInfo.hash) {
				// TODO: validate code hash matches hash
				this.code = await fetch(`${this.url}.js`).then((res) => res.text());
				this._store.info = newInfo;
				return true;
			}
		} catch {
		} finally {
			this.fetching._ = false;
		}
		return false;
	}
	// #endregion

	// #region Load
	private readonly loadSemaphore: Semaphore = new Semaphore(1);
	private async loadExports(force: boolean = false): Promise<void> {
		// Ensure we cant start loading midway through loading
		const release = await this.loadSemaphore.obtain();

		try {
			if (!force && !this.enabled) return;

			// If code hasnt changed and we have already loaded exports we are done
			if (!(await this.fetchNewInfo()) && this.exports !== undefined) return;

			// If code failed to fetch then nothing we can do
			if (this.code === undefined) return;
			this.loading._ = true;

			// Ensure we unload if previously loaded
			await this.unload();

			this.exports = await quartz(this.code, {
				plugins: [
					{
						resolve({ name }) {
							if (name.startsWith("@luna/lib")) {
								return `window.luna`;
							}
						},
					},
				],
			});

			// Ensure loadError is cleared
			this.loadError._ = undefined;

			const { onUnload, errSignal } = this.exports;

			if (onUnload !== undefined) {
				onUnload.source = "onUnload";
				this.unloads.add(onUnload);
			}
			if (errSignal !== undefined) {
				const unloadErrSignal: LunaUnload = errSignal.onValue((next) => (this.loadError._ = next));
				unloadErrSignal.source = "errSignal";
				this.unloads.add(unloadErrSignal);
			}

			// Prefix all unload sources with plugin name
			for (const unload of this.unloads) {
				unload.source = this.name + (unload.source ? `.${unload.source}` : "");
			}
		} catch (err) {
			// Alerting users can be handled downstream by listening to loadError
			this.loadError._ = (<any>err)?.message ?? err?.toString();
			// Log it to console anyway
			lTrace.err(`Failed to load plugin ${this.name}`, err);
			await this.unload();
			// For sanity throw the error just to be safe
			throw err;
		} finally {
			release();
			this.loading._ = false;
		}
	}
	// #endregion
}
// Expose to @luna/lib
(<typeof LunaPlugin>window.luna.LunaPlugin) = LunaPlugin;
