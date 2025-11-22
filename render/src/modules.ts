import type { Store } from "redux";
import { tidalModules } from "./exposeTidalInternals";
import { findModuleByProperty, recursiveSearch } from "./helpers/findModule";
import { modules, setReduxStore } from "./moduleRegistry";

const getParentModule = (root: any, path: (string | symbol)[]) => {
	let module = root;
	const parentPath = path.slice(0, -1);
	for (const key of parentPath) module = module[key];
	return module;
};

export const initModules = async (searchIn: Record<string, any> = tidalModules) => {
	const store = findModuleByProperty((key, value) => key === "replaceReducer" && typeof value === "function", searchIn);
	if (store) setReduxStore(store as Store);

	const needed = new Set(["react", "react/jsx-runtime", "react-dom/client", "react-dom"]);
	const matches = recursiveSearch(searchIn, (key, value) => {
		if (key === "createElement" && typeof value === "function" && needed.has("react")) return true;
		if (key === "jsx" && typeof value === "function" && needed.has("react/jsx-runtime")) return true;
		if (key === "createRoot" && typeof value === "function" && needed.has("react-dom/client")) return true;
		if (key === "createPortal" && typeof value === "function" && needed.has("react-dom")) return true;
		return false;
	});

	for (const match of matches) {
		const module = getParentModule(searchIn, match.path);

		if (needed.has("react") && typeof module.useState === "function" && typeof module.useEffect === "function" && typeof module.useId === "function") {
			modules["react"] = module;
			modules["react"].default ??= modules["react"];
			needed.delete("react");
		}

		if (needed.has("react/jsx-runtime") && typeof module.jsxs === "function" && typeof module.Fragment !== "undefined") {
			modules["react/jsx-runtime"] = module;
			modules["react/jsx-runtime"].default ??= modules["react/jsx-runtime"];
			needed.delete("react/jsx-runtime");
		}

		if (needed.has("react-dom/client") && typeof module.flushSync === "function") {
			modules["react-dom/client"] = module;
			modules["react-dom/client"].default ??= modules["react-dom/client"];
			needed.delete("react-dom/client");
		}

		if (needed.has("react-dom") && typeof module.findDOMNode === "function") {
			modules["react-dom"] = module;
			modules["react-dom"].default ??= modules["react-dom"];
			needed.delete("react-dom");
		}

		if (needed.size === 0) break;
	}

	if (!modules["oby"]) modules["oby"] = await import("oby");
	if (!modules["path"]) modules["path"] = (window as any).path;
};
