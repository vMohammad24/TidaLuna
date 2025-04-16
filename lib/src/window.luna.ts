if ((window.luna?.modulelCache ?? window.luna?.actions ?? window.luna?.interceptors ?? window.luna?.store) === undefined) {
	// If you are here check whats going on in render/src/core
	throw new Error("Luna core has not initalized core exports! Check window.luna for missing values");
}

// These are all initalized in @luna/core
export const moduleCache = window.luna.moduleCache;
export const actions = window.luna.actions;
export const interceptors = window.luna.interceptors;
export const store = window.luna.store;

declare global {
	interface Window {
		// Shouldnt be touching window.luna outside of here and core anwyay
		luna: any;
	}
}
