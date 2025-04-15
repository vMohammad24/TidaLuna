import type { Unload } from "./unloads";

import luna from "../window.luna";

export type InterceptCallback = (...args: unknown[]) => true | unknown;

export const intercept = (types: string | string[], cb: InterceptCallback, once: boolean = false): Unload => {
	if (typeof types === "string") return _intercept(types, cb, once);

	// If multiple types are passed wrap the unload functions in a single unload func and return that
	const unloads = [];
	for (const type of types) unloads.push(_intercept(type, cb, once));
	return () => {
		for (const unload of unloads) unload();
	};
};

const _intercept = (type: string, cb: InterceptCallback, once: boolean = false): Unload => {
	luna.interceptors[type] ??= new Set<InterceptCallback>();
	// If once is true then call unIntercept immediately to only run once
	const intercept = once
		? (...args) => {
				unIntercept();
				return cb(...args);
			}
		: cb;
	// Wrap removing the callback from the interceptors in a unload function and return it
	const unIntercept = () => luna.interceptors[type].delete(intercept);
	luna.interceptors[type].add(intercept);
	return unIntercept;
};
