// Always expose internals first
export { tidalModules } from "./exposeTidalInternals.js";
export { buildActions, interceptors } from "./exposeTidalInternals.patchAction.js";

export { findModuleByProperty, findModuleProperty } from "./helpers/findModule.js";
export { unloadSet } from "./helpers/unloadSet.js";

export { modules } from "./modules.js";

export * from "./LunaPlugin.js";
export * from "./ReactiveStore.js";

// Ensure this is loaded
import "./window.core.js";

// Restore the console
for (let key in console) {
	const orig = console[key];
	Object.defineProperty(console, key, {
		set() {
			return true;
		},
		get() {
			return orig;
		},
	});
}

// Force properties to be writable for patching? Dunno if this is needed but eh
const _defineProperty = Object.defineProperty;
Object.defineProperty = function (...args) {
	args[2].configurable = true;
	try {
		return _defineProperty.apply(this, args);
	} catch {}
};
Object.freeze = (arg) => arg;

import { LunaPlugin } from "./LunaPlugin.js";

// Wrap loading of plugins in a timeout so native/preload.ts can populate modules with @luna/core (see native/preload.ts)
setTimeout(async () => {
	// Load lib
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });
	// Load ui after lib as it depends on it.
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });
});
