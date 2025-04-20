// Always expose internals first
export { tidalModules } from "./exposeTidalInternals.js";
export { buildActions, interceptors } from "./exposeTidalInternals.patchAction.js";

export * as ftch from "./helpers/fetch.js";
export { findModuleByProperty, findModuleProperty } from "./helpers/findModule.js";
export { unloadSet, type LunaUnload } from "./helpers/unloadSet.js";

export { Messager, Tracer } from "./trace";

export { modules, reduxStore } from "./modules.js";

export * from "./LunaPlugin.js";
export * from "./ReactiveStore.js";

export const invoke = lunaNative.invoke;

export { Signal } from "@inrixia/helpers";

// Ensure this is loaded
import "./window.core.js";

import { LunaPlugin } from "./LunaPlugin.js";

// Wrap loading of plugins in a timeout so native/preload.ts can populate modules with @luna/core (see native/preload.ts)
setTimeout(async () => {
	// Load lib
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });
	// Load ui after lib as it depends on it.
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });

	// // Load unstable api's
	// await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.unstable" });

	// Load all plugins from storage
	await LunaPlugin.loadStoredPlugins();
});
