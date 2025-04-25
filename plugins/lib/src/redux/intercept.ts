import type { OutdatedActionPayloads } from "../outdated.types";
import type { ActionType } from "./intercept.actionTypes";

export type InterceptPayload<T extends ActionType> = T extends keyof OutdatedActionPayloads ? OutdatedActionPayloads[T] : unknown;
export type InterceptCallback<T extends ActionType, P = InterceptPayload<T>> = (payload: P) => true | unknown;
export type LunaInterceptors = {
	[K in ActionType]?: Set<InterceptCallback<K>>;
};

export type NullishUnloads = Set<LunaUnload> | null;

import { interceptors, type LunaUnload } from "@luna/core";

/**
 * Intercept a Redux action based on its `type`
 * @param actionType The ActionKey to intercept
 * @param cb Called when action is intercepted with action args, if returning true action is not dispatched (cancelled)
 * @param unloads Set of unload functions to add this to, can be null but only pass if you know what your doing
 * @param once If set true only intercepts once
 * @returns Function to call to unload/cancel the intercept
 */
export function intercept<T extends ActionType>(actionType: T, unloads: NullishUnloads, cb: InterceptCallback<T>, once?: boolean): LunaUnload;
export function intercept<P>(actionType: ActionType, unloads: NullishUnloads, cb: InterceptCallback<ActionType, P>, once?: boolean): LunaUnload;
export function intercept<T extends ActionType>(actionType: T, unloads: NullishUnloads, cb: InterceptCallback<T>, once?: boolean): LunaUnload {
	interceptors[actionType] ??= new Set<InterceptCallback<T>>();
	// If once is true then call unIntercept immediately to only run once
	const intercept = once
		? (payload: InterceptPayload<T>) => {
				unIntercept();
				return cb(payload);
			}
		: cb;
	// Wrap removing the callback from the interceptors in a unload function and return it
	const unIntercept = () => {
		// ?. so that it doesn't throw if the interceptor was already removed
		interceptors[actionType]?.delete(intercept);
		if (interceptors[actionType]?.size === 0) delete interceptors[actionType];
	};
	unIntercept.source = `intercept.${actionType}`;
	interceptors[actionType].add(intercept);
	unloads?.add(unIntercept);
	return unIntercept;
}

/**
 * Intercept a Redux action based on its `type`
 * @param actionType The ActionKey to intercept
 * @param unloads Set of unload functions to add this to, can be null but only pass if you know what your doing
 * @param cancel If set true the action is not dispatched (cancelled)
 * @returns A promise that resolves with the action payload when the action is intercepted
 */
export function interceptPromise<T extends ActionType>(actionType: T, unloads: NullishUnloads, cancel?: true): Promise<InterceptPayload<T>>;
export function interceptPromise<P>(actionType: ActionType, unloads: NullishUnloads, cancel?: true): Promise<P>;
export function interceptPromise<T extends ActionType>(actionType: T, unloads: NullishUnloads, cancel?: true): Promise<InterceptPayload<T>> {
	const { resolve, promise } = Promise.withResolvers<InterceptPayload<T>>();
	intercept(
		actionType,
		unloads,
		(payload) => {
			resolve(payload);
			return cancel;
		},
		true,
	);
	return promise;
}
