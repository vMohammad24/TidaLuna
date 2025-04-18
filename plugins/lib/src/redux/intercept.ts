import type { LunaUnload } from "..";
import type { OutdatedActionPayloads } from "./actions";
import type { ActionType } from "./intercept.actionTypes";

export type InterceptCallback<P extends unknown> = (payload: P, ...args: unknown[]) => true | unknown;
export type LunaInterceptors = {
	[K in ActionType]?: Set<InterceptCallback<unknown>>;
};

import { interceptors } from "@luna/core";

/**
 * Intercept a Redux action based on its `type`
 * @param type The ActionKey to intercept
 * @param cb Called when action is intercepted with action args, if returning true action is not dispatched (cancelled)
 * @param unloads Set of unload functions to add this to
 * @param once If set true only intercepts once
 * @returns Function to call to unload/cancel the intercept
 */
export function intercept<T extends Extract<keyof OutdatedActionPayloads, ActionType>>(
	type: T,
	unloads: Set<LunaUnload>,
	cb: InterceptCallback<OutdatedActionPayloads[T]>,
	once?: boolean,
): void;
export function intercept<V, T extends string = string>(type: T, unloads: Set<LunaUnload>, cb: InterceptCallback<V>, once?: boolean): void;
export function intercept<P extends unknown, T extends ActionType>(
	type: T,
	unloads: Set<LunaUnload>,
	cb: InterceptCallback<P>,
	once?: boolean,
): LunaUnload {
	interceptors[type] ??= new Set<InterceptCallback<unknown>>();
	// If once is true then call unIntercept immediately to only run once
	const intercept = once
		? (...args: [P, ...unknown[]]) => {
				unIntercept();
				return cb(...args);
			}
		: cb;
	// Wrap removing the callback from the interceptors in a unload function and return it
	const unIntercept = () => {
		interceptors[type].delete(intercept);
		if (interceptors[type].size === 0) delete interceptors[type];
	};
	unIntercept.source = `intercept.${type}`;
	interceptors[type].add(intercept);
	unloads.add(unIntercept);
	return unIntercept;
}
