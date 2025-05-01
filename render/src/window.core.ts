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
Object.defineProperty(window.luna, "unstable", {
	get: () => modules["@luna/unstable"],
	enumerable: true,
	configurable: false,
});
Object.defineProperty(window.luna, "dev", {
	get: () => modules["@luna/dev"],
	enumerable: true,
	configurable: false,
});
declare global {
	interface Window {
		luna: {
			// Throw lib, ui & core here for ease of use
			core?: typeof import("@luna/core");
			lib?: typeof import("@luna/lib");
			ui?: typeof import("@luna/ui");
			unstable?: typeof import("@luna/unstable");
			dev?: typeof import("@luna/dev");
		};
	}
	// Define lunaNative exports (see native/preload.ts)
	const lunaNative: {
		invoke: Electron.IpcRenderer["invoke"];
		on: Electron.IpcRenderer["on"];
		once: Electron.IpcRenderer["once"];
		removeListener: Electron.IpcRenderer["removeListener"];
	};
}
