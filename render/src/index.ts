// Always expose internals first
import "./core/exposeTidalInternals.js";

// Rip out of lib for use, horrible I know but I want my Tracer
// and this avoid triggering lib loading (we want it in a plugin to hotReload)
import { Tracer } from "../../plugins/lib/src/classes/Tracer.js";
export const lTrace = Tracer("[Luna]");

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

declare global {
	// Define lunaNative exports (see native/preload.ts)
	const lunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}

import { LunaPlugin } from "./LunaPlugin.js";
// Load lib & wait for it to be ready
await LunaPlugin.fromUri("https://luna/luna.lib", { enabled: true }).load();
console.log("[Luna] Lib loaded!");
// Load ui
await LunaPlugin.fromUri("https://luna/luna.ui", { enabled: true }).load();
console.log("[Luna] UI loaded!");
