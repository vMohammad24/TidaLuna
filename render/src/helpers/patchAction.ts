// @ts-expect-error Idk why TS thinks this module doesnt exist
import { after } from "spitroast";

import { actions, interceptors, store } from "@luna/lib";
import { lTrace } from "../index.js";

import type { LunaUnload } from "@luna/lib";

const patchAction = (_Obj: { _: Function }) => {
	after("_", _Obj, ([type], buildAction) => {
		if (interceptors[type] !== undefined) return;
		interceptors[type] ??= new Set<LunaUnload>();

		const builtAction = async (...args) => {
			// Just assume all buildAction's are promises for the sake of safety
			return store.dispatch(await buildAction(...args));
		};

		actions[type] = builtAction;

		return new Proxy(buildAction, {
			// Intercept all original calls to buildAction
			apply(orig, ctxt, args) {
				let shouldDispatch = true;
				// Run interceptors with
				for (const interceptor of interceptors[type]) {
					try {
						if (interceptor(...args) === true) shouldDispatch = false;
					} catch (err) {
						lTrace.err.withContext("Failed to run interceptor!")(err);
					}
				}
				return shouldDispatch ? orig.apply(ctxt, args) : { type: "NOOP" };
			},
		});
	});
	return _Obj;
};
window.patchAction = patchAction;
