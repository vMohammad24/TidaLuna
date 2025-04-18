import type * as lib from "@luna/lib";
import type * as ui from "@luna/ui";
import type * as core from "./index.js";

export const modules: Record<string, object> = {};

// Define getters for lib and ui to proxy to modules
Object.defineProperty(window.luna, "lib", {
	get: () => modules["@luna/lib"],
	enumerable: true,
	configurable: false,
});
Object.defineProperty(window.luna, "ui", {
	get: () => modules["@luna/ui"],
	enumerable: true,
	configurable: false,
});

declare global {
	interface Window {
		luna: {
			// Throw lib, ui & core here for ease of use
			lib?: typeof lib;
			ui?: typeof ui;
			core?: typeof core;
		};
	}
	// Define lunaNative exports (see native/preload.ts)
	const lunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}
