import type { MaybePromise, VoidLike } from "@inrixia/helpers";
import type { Store } from "redux";
import type { ActionType } from "./actionTypes";
import type { InterceptCallback } from "./intercept";

export type LunaAction<P = unknown> = P extends VoidLike ? () => MaybePromise<VoidLike> : (payload: P) => MaybePromise<VoidLike>;
export type LunaActions = {
	[K in ActionType]: LunaAction;
};

export type { ActionTypes as OActionPayloads } from "neptune-types/tidal";
export type LunaInterceptors = {
	[K in ActionType]: Set<InterceptCallback<unknown>>;
};

export type { LunaUnload } from "./unloads";

export const moduleCache: Record<string, any> = {};
export const actions = <LunaActions>{};
export const interceptors = <LunaInterceptors>{};
export const store = <Store>{};

export { ContextMenu } from "./classes/ContextMenu";
export { Tracer } from "./classes/Tracer";
export { findModuleProperty } from "./findModuleProperty";
export { intercept } from "./intercept";
