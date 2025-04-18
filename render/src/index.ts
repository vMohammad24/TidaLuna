// Always expose internals first
import "./core/exposeTidalInternals.js";

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

// Load lib & wait for it to be ready
await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.lib" });
// Load ui
await LunaPlugin.fromStorage({ enabled: true, url: "https://luna/luna.ui" });
