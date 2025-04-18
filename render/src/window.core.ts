import type * as lib from "@luna/lib";
import type * as ui from "@luna/ui";
import { LunaPlugin } from "./LunaPlugin.js";
import { type LunaStorage, storage } from "./storage.js";

// Init window.luna
window.luna ??= {
	LunaPlugin,
	storage,
	tidalModules: {},
	interceptors: {},
	_buildActions: {},
};

export const tidalModules = window.luna.tidalModules;
export const interceptors = window.luna.interceptors;
export const _buildActions = window.luna._buildActions;

// Define getters for lib and ui to proxy to modules
Object.defineProperty(window.luna, "lib", {
	get: () => LunaPlugin.modules["@luna/lib"],
	enumerable: true,
	configurable: false,
});
Object.defineProperty(window.luna, "ui", {
	get: () => LunaPlugin.modules["@luna/ui"],
	enumerable: true,
	configurable: false,
});

declare global {
	interface Window {
		luna: {
			LunaPlugin: typeof LunaPlugin;
			// Throw lib & ui here for ease of use, proxied to LunaPlugin.modules
			lib?: typeof lib;
			ui?: typeof ui;

			// Exposed tidal internals
			tidalModules: Record<string, any>;
			interceptors: Record<string, Set<Function>>;
			_buildActions: Record<string, Function>;

			// Storage
			storage: LunaStorage;
		};
	}
	// Define lunaNative exports (see native/preload.ts)
	const lunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}
