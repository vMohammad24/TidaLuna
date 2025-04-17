import type { MaybePromise, VoidLike } from "@inrixia/helpers";
import type { Store } from "redux";
import type { InterceptCallback } from "./intercept";
import type { ActionType } from "./intercept.actionTypes";

export type LunaAction<P = unknown> = P extends VoidLike ? () => MaybePromise<VoidLike> : (payload: P) => MaybePromise<VoidLike>;
export type LunaActions = {
	[K in ActionType]: LunaAction;
};

export type { ActionTypes as OActionPayloads } from "neptune-types/tidal";
export type LunaInterceptors = {
	[K in ActionType]?: Set<InterceptCallback<unknown>>;
};

if ((window.luna?.modulelCache ?? window.luna?.actions ?? window.luna?.interceptors ?? window.luna?.store) === undefined) {
	// If you are here check whats going on in render/src/core
	throw new Error("Luna core has not initalized core exports! Check window.luna for missing values");
}

// These are all initalized in @luna/core
export const moduleCache: Record<string, any> = window.luna.moduleCache;
export const actions = <LunaActions>window.luna.actions;
export const interceptors = <LunaInterceptors>window.luna.interceptors;
export const redux = <Store>window.luna.redux;

declare global {
	interface Window {
		// Shouldnt be touching window.luna outside of here and window.core anwyay
		luna: any;
	}
}
