import type { MaybePromise, VoidLike } from "@inrixia/helpers";
import type { ActionType } from "./intercept.actionTypes";

import { store } from "./store";

export type { ActionTypes as OutdatedActionPayloads } from "neptune-types/tidal";

export type LunaAction<P = unknown> = P extends VoidLike ? () => MaybePromise<VoidLike> : (payload: P) => MaybePromise<VoidLike>;
export type LunaActions = {
	[K in ActionType]: LunaAction;
};

const _buildActions = window.luna._buildActions;

export const actions = {};
for (const [name, buildAction] of Object.entries(_buildActions)) {
	actions[name] = (...args: any[]) => store.dispatch(buildAction(...args));
}
