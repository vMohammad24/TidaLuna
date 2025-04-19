import quartz, { type QuartzPlugin } from "@uwu/quartz";

// Ensure patchAction is loaded on window!
import "./exposeTidalInternals.patchAction.js";

import { resolveAbsolutePath } from "./helpers/resolvePath.js";

import { findCreateActionFunction } from "./helpers/findCreateAction.js";

export const tidalModules = {};

const fetchCode = async (path) => {
	const res = await fetch(path);
	// Include sourceURL so that dev tools shows things nicely under sources
	return `${await res.text()}\n//# sourceURL=${path}`;
};

const messageContainer = document.getElementById("tidaluna-loading-text");

const dynamicResolve: QuartzPlugin["dynamicResolve"] = async ({ name, moduleId, config }) => {
	const path = resolveAbsolutePath(moduleId, name);
	if (tidalModules[path]) return tidalModules[path];

	messageContainer.innerText += `Loading ${path}\n`;
	const code = await fetchCode(path);

	// Load each js module and store it in the cache so we can access its exports
	tidalModules[path] = await quartz(code, config, path);
	return tidalModules[path];
};

// Theres usually only 1 script on page that needs injecting (https://desktop.tidal.com/) see native/injector
// So dw about blocking for loop
for (const script of document.querySelectorAll<HTMLScriptElement>(`script[type="luna/quartz"]`)) {
	const scriptPath = new URL(script.src).pathname;

	const scriptContent = await fetchCode(scriptPath);

	// Fetch, transform execute and store the module in moduleCache
	// Hijack the Redux store & inject interceptors
	tidalModules[scriptPath] = await quartz(
		scriptContent,
		{
			// Quartz runs transform > dynamicResolve > resolve
			plugins: [
				{
					transform({ code }) {
						const actionData = findCreateActionFunction(code);

						if (actionData) {
							const { fnName, startIdx } = actionData;
							const funcPrefix = "__LunaUnpatched_";
							const renamedFn = funcPrefix + fnName;

							// Rename the original function declaration by adding a prefix
							// Example: `prepareAction` becomes `__LunaUnpatched_prepareAction`
							code = code.slice(0, startIdx) + funcPrefix + code.slice(startIdx);

							// Assuming the declaration starts 9 characters before the function name
							// (e.g., accounting for "const " or "function ")
							const declarationStartIdx = startIdx - 9;
							const patchedDeclaration = `const ${fnName} = patchAction({ _: ${renamedFn} })._;`;

							// Insert the new patched declaration before the original (now renamed) one
							code = code.slice(0, declarationStartIdx) + patchedDeclaration + code.slice(declarationStartIdx);
						}

						return code;
					},
					dynamicResolve,
					async resolve({ name, moduleId, config, accessor, store }) {
						(store as any).exports = await dynamicResolve({ name, moduleId, config });
						return `${accessor}.exports`;
					},
				},
			],
		},
		scriptPath,
	);
}
// if (Object.keys(actions).length === 0 || Object.keys(moduleCache).length === 0 || Object.keys(redux).length === 0) {
// 	throw new Error("Luna.core failed to init!");
// }
