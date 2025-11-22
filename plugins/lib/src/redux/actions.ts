import type { MaybePromise, VoidLike } from "@inrixia/helpers";
import type { ActionType } from "./types/actions/actionTypes";

import { buildActions, reduxStore } from "@luna/core";
import type { ActionPayloads } from "./types";

export type LunaActions = {
	[K in ActionType]: (payload: ActionPayloads[K]) => MaybePromise<VoidLike>;
};

export const actions: LunaActions = new Proxy({} as LunaActions, {
	get: (_target, prop: string) => {
		const buildAction = buildActions[prop];
		if (buildAction) {
			return (...args: any[]) => reduxStore.dispatch(buildAction(...args));
		}
	},
});
