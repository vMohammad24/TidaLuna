export * from "./window.luna";

import type { MaybePromise, VoidFn, VoidLike } from "@inrixia/helpers";

import type { ActionType } from "./intercept.actionTypes";
import type { InterceptCallback } from "./intercept.js";

export { findModuleByProperty, findModuleProperty } from "./helpers/findModule";
export { actionTypes, type ActionType } from "./intercept.actionTypes";
export { intercept } from "./intercept.js";

export { ContextMenu } from "./classes/ContextMenu";
export { Page } from "./classes/Page";
export { StyleTag } from "./classes/StyleTag";
export { Tracer } from "./classes/Tracer";
export { React, ReactDom } from "./react/react";

export type LunaAction<P = unknown> = P extends VoidLike ? () => MaybePromise<VoidLike> : (payload: P) => MaybePromise<VoidLike>;
export type LunaActions = {
	[K in ActionType]: LunaAction;
};

export type { ActionTypes as OActionPayloads } from "neptune-types/tidal";
export type LunaInterceptors = {
	[K in ActionType]?: Set<InterceptCallback<unknown>>;
};
export interface LunaUnload extends VoidFn {
	source?: string;
}
