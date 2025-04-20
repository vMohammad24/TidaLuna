// Always expose internals first
export { tidalModules } from "./exposeTidalInternals.js";
export { buildActions, interceptors } from "./exposeTidalInternals.patchAction.js";

export { findModuleByProperty, findModuleProperty } from "./helpers/findModule.js";
export { unloadSet } from "./helpers/unloadSet.js";

export { modules } from "./modules.js";

export * from "./LunaPlugin.js";
export * from "./ReactiveStore.js";

export const invoke = lunaNative.invoke;

// Ensure this is loaded
import "./window.core.js";

import { LunaPlugin } from "./LunaPlugin.js";

// Wrap loading of plugins in a timeout so native/preload.ts can populate modules with @luna/core (see native/preload.ts)
setTimeout(async () => {
	// Load lib
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });
	// Load ui after lib as it depends on it.
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });

	await LunaPlugin.loadStoredPlugins();
});
