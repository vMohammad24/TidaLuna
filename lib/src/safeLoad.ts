import { Promize, type MaybePromise, type VoidLike } from "@inrixia/helpers";
import type { Store } from "redux";
import type { ActionType } from "./actionTypes";
import type { InterceptCallback } from "./intercept";

export type LunaAction<P = unknown> = P extends VoidLike ? () => MaybePromise<VoidLike> : (payload: P) => MaybePromise<VoidLike>;
export type LunaActions = {
	[K in ActionType]: LunaAction;
};

export type { ActionTypes as OActionPayloads } from "neptune-types/tidal";
export type LunaInterceptors = {
	[K in ActionType]?: Set<InterceptCallback<unknown>>;
};

// Export costs seperate to window.luna to avoid race conditions with cyclic dependencies
export const moduleCache: Record<string, any> = {};
export const actions = <LunaActions>{};
export const interceptors = <LunaInterceptors>{};
export const store = <Store>{};

export const loaded = new Promize<void>();
