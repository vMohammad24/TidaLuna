// Always expose internals first
export { tidalModules } from "./core/exposeTidalInternals.js";
export { buildActions, interceptors } from "./core/patchAction.js";
export { LunaPlugin } from "./LunaPlugin.js";
export { ReactiveStore } from "./ReactiveStore.js";

// Ensure window values are set
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

// Force properties to be writable for patching
const _defineProperty = Object.defineProperty;
Object.defineProperty = function (...args) {
	args[2].configurable = true;
	try {
		return _defineProperty.apply(this, args);
	} catch {}
};
Object.freeze = (arg) => arg;

import { LunaPlugin } from "./LunaPlugin.js";

// Wrap loading of plugins in a timeout to allow the preload to set luna.core to @luna/core (see native/preload.ts)
setTimeout(async () => {
	// Load lib
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });
	// Load ui after lib as it depends on it. TODO: Automagically handle dependency load ordering
	await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });
});
