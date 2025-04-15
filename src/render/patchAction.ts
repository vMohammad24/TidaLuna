// @ts-expect-error Idk why TS thinks this module doesnt exist
import { after } from "spitroast";

import type { Unload } from "./lib/unloads";

export default (_Obj: { _: Function }) => {
	after("_", _Obj, ([type], buildAction) => {
		if (!luna.interceptors[type]) luna.interceptors[type] = new Set<Unload>();

		// Convert action type from snakecase to camelCase eg "playbackControls/INCREASE_VOLUME" to ["playQueue", "increaseVolume"]
		const [parent, child] = type.split("/").map((segment) => {
			if (segment.toUpperCase() == segment) {
				// Convert to camelcase
				return segment.toLowerCase().replace(/_([a-z])/g, (_, i) => i.toUpperCase());
			}
			return segment;
		});

		const builtAction = async (...args) => {
			// Just assume all buildAction's are promises for the sake of safety
			const action = await buildAction(...args);
			return luna.store.dispatch(action);
		};

		if (child) {
			luna.actions[parent] ??= {};
			luna.actions[parent][child] = builtAction;
		} else {
			luna.actions[parent] = builtAction;
		}

		return new Proxy(buildAction, {
			// Intercept all original calls to buildAction
			apply(orig, ctxt, args) {
				let shouldDispatch = true;
				// Run interceptors with
				for (const interceptor of luna.interceptors[type]) {
					try {
						if (interceptor(...args) === true) shouldDispatch = false;
					} catch (err) {
						console.error("[Luna]", "Failed to run interceptor!", err);
					}
				}
				return shouldDispatch ? orig.apply(ctxt, args) : { type: "NOOP" };
			},
		});
	});
	return _Obj;
};
