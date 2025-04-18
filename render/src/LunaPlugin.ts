// Ensure that @triton/lib is loaded onto window for plugins to use shared memory space
import { Semaphore, Signal } from "@inrixia/helpers";
import quartz from "@uwu/quartz";
import { log, logErr, logWarn } from "./helpers/console.js";
import { unloadSet } from "./helpers/unloadSet.js";
import { storage } from "./storage.js";

import type { LunaUnload } from "@luna/lib";

type ModuleExports = {
	unloads?: Set<LunaUnload>;
	onUnload?: LunaUnload;
	Settings?: React.FC;
	errSignal?: Signal<string | undefined>;
};

export type LunaAuthor = {
	name: string;
	url: string;
	avatarUrl?: string;
};
export type PluginPackage = {
	author: LunaAuthor;
	name: string;
	hash: string;
	description?: React.ReactNode;
	version?: string;
	dependencies?: string[];
	devDependencies?: string[];
	code?: string;
};

// If adding to this make sure that the values are initalized in LunaPlugin.fromStorage
export type LunaPluginStorage = {
	url: string;
	package: PluginPackage;
	enabled: boolean;
	liveReload: boolean;
};

type PartialLunaPluginStorage = Partial<LunaPluginStorage> & { url: string };

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

	private static fetchOrThrow(url: string): Promise<Response> {
		return fetch(url).then((res) => {
			if (!res.ok) {
				throw new Error(`Failed to fetch ${url} (${res.status})`);
			}
			return res;
		});
	}
	private static fetchJson<T>(url: string): Promise<T> {
		return this.fetchOrThrow(url).then((res) => res.json());
	}
	private static fetchText(url: string): Promise<string> {
		return this.fetchOrThrow(url).then((res) => res.text());
	}
	public static async fetchPackage(url: string): Promise<PluginPackage> {
		return this.fetchJson(`${url}.json`);
	}

	// Storage backing for persisting plugin url/enabled/code etc... See LunaPluginStorage
	public static readonly pluginStorage = (storage["__plugins"] ??= {});
	// Static store for all loaded plugins so we dont double load any
	public static readonly plugins: Record<string, LunaPlugin> = {};
	// Static store for all loaded modules for dynamic imports
	public static readonly modules: Record<string, ModuleExports> = {};

	/**
	 * Create a plugin instance from a store:LunaPluginStorage, if package is not populated it will be fetched using the url so we can get the name
	 */
	public static async fromStorage(store: PartialLunaPluginStorage): Promise<LunaPlugin> {
		store.package ??= await this.fetchPackage(store.url);
		const name = store.package.name;
		const plugin = (this.plugins[name] ??= new this(name, store));
		return plugin.load();
	}
	// #endregion

	// #region constructor
	private constructor(
		public readonly name: string,
		storage: PartialLunaPluginStorage,
	) {
		this.store = {
			...storage,
			...this.store,
		};
		// Enabled has to be setup first because liveReload below accesses it
		this._enabled = new Signal(this.store.enabled, (next) => {
			// Protect against disabling permanantly in the background if loading causes a error
			// Restarting the client will attempt to load again
			if (this.loadError._ === undefined) this.store.enabled = next;
		});
		// Allow other code to listen to onEnabled (this._enabled is private)
		this.onEnabled = this._enabled.onValue.bind(this._enabled);

		this.liveReload = new Signal(this.store.liveReload, (next) => {
			if ((this.store.liveReload = next)) this.startReloadLoop();
			else this.stopReloadLoop();
		});
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

	public readonly liveReload: Signal<boolean>;
	private readonly _enabled: Signal<boolean>;

	public onEnabled;
	public get enabled() {
		return this._enabled._;
	}
	// #endregion

	// #region _exports
	private get exports() {
		return LunaPlugin.modules[this.name];
	}
	private set exports(exports: ModuleExports | undefined) {
		if (this._unloads.size !== 0) {
			// If we always unload on load then we should never be here
			logWarn(`Plugin ${this.name} is trying to set exports but unloads are not empty! Please report this to the Luna devs.`, this);
			// This is a safety check to ensure we dont leak unloads
			// If there is somehow leftover unloads we need to add them to the new exports.unloads if it exists
			if (exports?.unloads !== undefined) {
				for (const unload of this._unloads) exports.unloads.add(unload);
				this._unloads.clear();
			}
		}
		// Cast to set, _exports is readonly to avoid accidental internal modification
		LunaPlugin.modules[this.name] = exports;
	}
	private readonly _unloads: Set<LunaUnload> = new Set();
	private get unloads() {
		return this.exports?.unloads ?? this._unloads;
	}
	// #endregion

	// #region Storage
	public get store(): LunaPluginStorage {
		return (LunaPlugin.pluginStorage[this.name] ??= {});
	}
	private set store(value: LunaPluginStorage) {
		LunaPlugin.pluginStorage[this.name] = value;
	}
	public get url(): string {
		return this.store.url;
	}
	public get package(): PluginPackage | undefined {
		return this.store.package;
	}
	private set package(value: PluginPackage) {
		this.store.package = value;
	}
	// #endregion

	// #region load/unload
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
	/**
	 * Load the plugin if it is enabled
	 */
	public async load(): Promise<LunaPlugin> {
		this.package ??= await LunaPlugin.fetchPackage(this.url);
		if (this.enabled) await this.enable();
		return this;
	}
	// #endregion

	// #region enable/disable
	public async enable() {
		await this.loadExports();
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
	 * Returns true if code changed, should never be called outside of loadExports
	 */
	private async fetchPackage(): Promise<boolean> {
		try {
			this.fetching._ = true;
			const newPackage = await LunaPlugin.fetchPackage(this.url);
			// Delete this just to be safe
			delete newPackage.code;
			const codeChanged = this.package.hash !== newPackage.hash;
			// If hash hasnt changed then just reuse stored code
			// If it has then next time this.code() is called it will fetch the new code as newPackage.code is undefined
			if (!codeChanged) newPackage.code = this.package.code;
			this.package = newPackage;
			return codeChanged;
		} catch {
			// Fail silently if we cant fetch
		} finally {
			this.fetching._ = false;
		}
		return false;
	}
	public async code() {
		return (this.package.code ??= `${await LunaPlugin.fetchText(`${this.url}.js`)}\n//# sourceURL=${this.url}.js`);
	}
	// #endregion

	// #region Load
	private readonly loadSemaphore: Semaphore = new Semaphore(1);
	private async loadExports(): Promise<void> {
		// Ensure we cant start loading midway through loading
		const release = await this.loadSemaphore.obtain();
		try {
			// If code hasnt changed and we have already loaded exports we are done
			if (!(await this.fetchPackage()) && this.exports !== undefined) return;

			const code = await this.code();
			// If code failed to fetch then nothing we can do
			if (code === undefined) return;
			this.loading._ = true;

			// Ensure we unload if previously loaded
			await this.unload();

			// Transforms are done at build so dont need quartz here (for now :3)
			this.exports = await quartz(code, {
				plugins: [
					{
						resolve: ({ name }) => {
							if (LunaPlugin.modules[name] === undefined) {
								const errMsg = `Failed to load plugin ${this.name}, module ${name} not found!`;
								logErr(errMsg, this);
								throw new Error(errMsg);
							}
							return `luna.LunaPlugin.modules["${name}"]`;
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

			log(`Loaded plugin ${this.name}`, this);
		} catch (err) {
			// Set loadError for anyone listening
			this.loadError._ = (<any>err)?.message ?? err?.toString();
			// Notify users
			logErr(`Failed to load plugin ${this.name}`, this, err);
			// Ensure we arnt partially loaded
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
