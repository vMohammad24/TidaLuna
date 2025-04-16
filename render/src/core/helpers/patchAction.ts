// @ts-expect-error Idk why TS thinks this module doesnt exist
import { after } from "spitroast";

import { actions, interceptors, store } from "../window.core.js";

const patchAction = (_Obj: { _: Function }) => {
	after("_", _Obj, ([type], buildAction) => {
		if (actions[type] !== undefined) return;

		// Just assume all buildAction's are promises for the sake of safety
		actions[type] = async (...args) => store.dispatch(await buildAction(...args));

		return new Proxy(buildAction, {
			// Intercept all original calls to buildAction
			apply(orig, ctxt, args: [unknown, ...unknown[]]) {
				const interceptor = interceptors[type];
				let shouldDispatch = true;
				if (interceptor?.size > 0) {
					for (const interceptor of interceptors[type]) {
						try {
							if (interceptor(...args) === true) shouldDispatch = false;
						} catch (err) {
							console.error("[Luna.core]", "Failed to run interceptor!", err);
						}
					}
				}
				return shouldDispatch ? orig.apply(ctxt, args) : { type: "NOOP" };
			},
		});
	});
	return _Obj;
};

declare global {
	interface Window {
		patchAction: typeof patchAction;
	}
}
window.patchAction = patchAction;
