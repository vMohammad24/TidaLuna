import * as luna from "@luna/lib";
window.luna = luna;

import "./handleExfiltrations.js";
import "./settings.js";

export const lTrace = luna.Tracer("[Luna]");

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
	interface Window {
		luna: typeof luna;
		patchAction: unknown;
	}
	const LunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}
