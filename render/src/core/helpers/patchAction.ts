// @ts-expect-error Idk why TS thinks this module doesnt exist
import { after } from "spitroast";

import { actions, interceptors, redux } from "../window.core.js";

// Ick
import { logErr } from "../../helpers/logErr.js";

const patchAction = (_Obj: { _: Function }) => {
	after("_", _Obj, ([type], buildAction) => {
		if (actions[type] !== undefined) return;

		// Just assume all buildAction's are promises for the sake of safety
		actions[type] = async (...args) => redux.dispatch(await buildAction(...args));

		return new Proxy(buildAction, {
			// Intercept all original calls to buildAction
			apply(orig, ctxt, args: [unknown, ...unknown[]]) {
				const interceptor = interceptors[type];
				let shouldDispatch = true;
				if (interceptor?.size > 0) {
					for (const interceptor of interceptors[type]) {
						try {
							const result = interceptor(...args);
							if (result === true) shouldDispatch = false;
							else if (result instanceof Promise) result.catch((err) => logErr.msg("Failed to run interceptor!", type, err));
						} catch (err) {
							logErr.msg("Failed to run interceptor!", type, err);
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
