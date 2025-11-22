// Always expose internals first
export { addQuartzPlugin, loadTidalModules, tidalModules } from "./exposeTidalInternals";
export { buildActions, interceptors } from "./exposeTidalInternals.patchAction";

export * as ftch from "./helpers/fetch";
export { findModuleByProperty, findModuleProperty, recursiveSearch } from "./helpers/findModule";
export { unloadSet, type LunaUnload, type LunaUnloads, type NullishLunaUnloads } from "./helpers/unloadSet";

export { Messager, Tracer } from "./trace";

export { modules, reduxStore } from "./moduleRegistry";
export { initModules } from "./modules";

export * from "./LunaPlugin";
export * from "./ReactiveStore";

// Ensure this is loaded
import "./window.core";

import { LunaPlugin } from "./LunaPlugin";
import { loadTidalModules } from "./exposeTidalInternals";
import { initModules } from "./modules";

export const init = async () => {
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib.native" });
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });

	const tempCache = {};
	const originalGetElementById = document.getElementById;
	document.getElementById = (id: string) => {
		if (id === "app" || id === "root") return null;
		return originalGetElementById.call(document, id);
	};
	const originalDefine = customElements.define;
	customElements.define = () => { };

	await loadTidalModules(tempCache, false);
	document.getElementById = originalGetElementById;
	customElements.define = originalDefine;

	await initModules(tempCache);

	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.dev" });

	await LunaPlugin.loadStoredPlugins();

	await loadTidalModules();
	await initModules();

	for (const plugin of Object.values(LunaPlugin.plugins)) {
		if (plugin.loadError._) {
			plugin.trace.log("Retrying load after modules init...");
			await plugin.load();
		}
	}
};
