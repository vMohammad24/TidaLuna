import { Memo } from "@inrixia/helpers";
import type { Store } from "redux";
import { findModuleByProperty, findModuleProperty } from "./helpers/findModule.js";

export const modules: Record<string, any> = {};

// Define a global require function to use modules for cjs imports bundled with esbuild
window.require = <NodeJS.Require>((moduleName: string) => {
	if (modules.hasOwnProperty(moduleName)) return modules[moduleName];
	throw new Error(`Dynamic require called for '${moduleName}' does not exist in core.modules!`);
});
window.require.cache = modules;
window.require.main = undefined;

export const reduxStore: Store = findModuleByProperty("replaceReducer", "function")!;
export const getCredentials = Memo.argless(() =>
	findModuleProperty<() => Promise<{ token: string; clientId: string }>>("getCredentials", "function")?.value(),
);

// Expose react
modules["react"] = findModuleByProperty("createElement", "function");
modules["react"].default ??= modules["react"];

modules["react/jsx-runtime"] = findModuleByProperty("jsx", "function");
modules["react/jsx-runtime"].default ??= modules["react/jsx-runtime"];

// Expose react-dom
modules["react-dom/client"] = findModuleByProperty("createRoot", "function");
modules["react-dom/client"].default ??= modules["react-dom/client"];

modules["oby"] = await import("oby");
