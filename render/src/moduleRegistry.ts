import type { Store } from "redux";

export const modules: Record<string, any> = {
    "react": {},
    "react/jsx-runtime": {},
    "react-dom": {},
    "react-dom/client": {},
};

// Define a global require function to use modules for cjs imports bundled with esbuild
window.require = <NodeJS.Require>((moduleName: string) => {
    if (modules.hasOwnProperty(moduleName)) return modules[moduleName];
    throw new Error(`Dynamic require called for '${moduleName}' does not exist in core.modules!`);
});
window.require.cache = modules;
window.require.main = undefined;

export let reduxStore: Store;
export const setReduxStore = (store: Store) => {
    reduxStore = store;
};
