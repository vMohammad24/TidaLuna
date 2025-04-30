import type { OutdatedActionPayloads } from "../outdated.types";
import type { ActionType } from "./intercept.actionTypes";

export type InterceptPayload<T extends ActionType | ReadonlyArray<ActionType>> =
	T extends ReadonlyArray<infer U extends ActionType> // Check if T is an array, ensure U is ActionType
		? InterceptPayload<U> // If yes, give a union of all payloads
		: T extends keyof OutdatedActionPayloads // If no (T is ActionType), check if it's a known key
			? OutdatedActionPayloads[T] // If yes, get the specific payload
			: unknown; // Otherwise, the payload is unknown

export type InterceptCallback<T extends ActionType | ActionType[], P = InterceptPayload<T>> = (payload: P) => true | unknown;
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
export function intercept<T extends ActionType[]>(actionType: T, unloads: NullishUnloads, cb: InterceptCallback<T>, once?: boolean): LunaUnload;
export function intercept<P>(
	actionTypes: ActionType[],
	unloads: NullishUnloads,
	cb: InterceptCallback<ActionType, P>,
	once?: boolean,
): LunaUnload;
export function intercept<T extends ActionType | ActionType[]>(
	actionTypes: T,
	unloads: NullishUnloads,
	cb: InterceptCallback<T>,
	once?: boolean,
): LunaUnload {
	const actionTypeArray: ActionType[] = Array.isArray(actionTypes) ? actionTypes : [actionTypes];

	// If once is true then call unIntercept immediately to only run once
	const intercept = once
		? (payload: InterceptPayload<T>) => {
				unIntercept();
				return cb(payload);
			}
		: cb;

	// Wrap removing the callback from the interceptors in a unload function and return it
	const unIntercept = () => {
		for (const actionType of actionTypeArray) {
			// ?. so that it doesn't throw if the interceptor was already removed
			interceptors[actionType]?.delete(intercept);
			if (interceptors[actionType]?.size === 0) delete interceptors[actionType];
		}
	};
	unIntercept.source = `intercept${JSON.stringify(actionTypeArray)}`;

	for (const actionType of actionTypeArray) {
		interceptors[actionType] ??= new Set<InterceptCallback<T>>();
		interceptors[actionType].add(intercept);
		unloads?.add(unIntercept);
	}
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
