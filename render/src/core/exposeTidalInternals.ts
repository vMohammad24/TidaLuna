import quartz, { type QuartzPlugin } from "@uwu/quartz";

// Ensure patchAction is loaded on window!
import "./patchAction.js";

import { resolveAbsolutePath } from "./helpers/resolvePath.js";

import { findPrepareActionNameAndIdx } from "./helpers/findPrepareActionNameAndIdx.js";
import { moduleCache } from "./window.core.js";

const fetchCode = async (path) => {
	const res = await fetch(path);
	// Include sourceURL so that dev tools shows things nicely under sources
	return `${await res.text()}\n//# sourceURL=${path}`;
};

const dynamicResolve: QuartzPlugin["dynamicResolve"] = async ({ name, moduleId, config }) => {
	const path = resolveAbsolutePath(moduleId, name);
	if (moduleCache[path]) return moduleCache[path];

	const code = await fetchCode(path);

	// Load each js module and store it in the cache so we can access its exports
	moduleCache[path] = await quartz(code, config, path);
	return moduleCache[path];
};

// Theres usually only 1 script on page that needs injecting (https://desktop.tidal.com/) see native/injector
// So dw about blocking for loop
for (const script of document.querySelectorAll<HTMLScriptElement>(`script[type="luna/quartz"]`)) {
	const scriptPath = new URL(script.src).pathname;

	const scriptContent = await fetchCode(scriptPath);

	// Fetch, transform execute and store the module in moduleCache
	// Hijack the Redux store & inject interceptors
	moduleCache[scriptPath] = await quartz(
		scriptContent,
		{
			// Quartz runs transform > dynamicResolve > resolve
			plugins: [
				{
					transform({ code }) {
						const actionData = findPrepareActionNameAndIdx(code);

						if (actionData) {
							const { name: prepareActionName, idx: prepareActionIdx } = actionData;

							const funcPrefix = "__LunaUnpatched_";

							// rename function declaration
							code = code.slice(0, prepareActionIdx) + funcPrefix + code.slice(prepareActionIdx);

							code =
								code.slice(0, prepareActionIdx - 9) +
								`const ${prepareActionName} = patchAction({ _: ${funcPrefix}${prepareActionName} })._;` +
								code.slice(prepareActionIdx - 9);
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
