import { modules } from "./modules.js";

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
			lib?: typeof import("@luna/lib");
			ui?: typeof import("@luna/ui");
			core?: typeof import("@luna/core");
		};
	}
	// Define lunaNative exports (see native/preload.ts)
	const lunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}
