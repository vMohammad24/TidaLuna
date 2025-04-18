import { findModuleByProperty } from "./helpers/findModule.js";

export const modules: Record<string, any> = {};

// Expose react
modules["react"] = findModuleByProperty("createElement", "function");
modules["react"].default ??= modules["react"];

modules["react/jsx-runtime"] = findModuleByProperty("jsx", "function");
modules["react/jsx-runtime"].default ??= modules["react/jsx-runtime"];

// Expose react-dom
modules["react-dom/client"] = findModuleByProperty("createRoot", "function");
modules["react-dom/client"].default ??= modules["react-dom/client"];
