import { modules, type LunaUnloads } from "@luna/core";
import React from "react";

import { libTrace } from "../index.safe";

export type ComponentMatcher = (props: any) => boolean;
export type InjectionPosition = "start" | "end" | number;

export interface InjectionConfig {
	/** Function to match the target element's props */
	matcher: ComponentMatcher;
	/** The React component to inject */
	component: React.ReactNode;
	/** Where to inject: 'start', 'end', or a specific index */
	position?: InjectionPosition;
}

const injections = new Set<InjectionConfig>();

/**
 * Patches the React JSX runtime to inject custom components into existing Tidal components.
 * Call this once during initialization to enable component injection.
 */
export const enableComponentInjection = (unloads: LunaUnloads): boolean => {
	const jsxRuntime = modules["react/jsx-runtime"];

	if (!jsxRuntime?.jsx || !jsxRuntime?.jsxs) {
		libTrace.warn("injectComponent.enableComponentInjection", "jsx runtime not found - component injection unavailable");
		return false;
	}

	const originalJsx = jsxRuntime.jsx;
	const originalJsxs = jsxRuntime.jsxs;

	jsxRuntime.jsxs = function (type: any, props: any, ...rest: any[]) {
		if (props && injections.size > 0) {
			for (const injection of injections) {
				if (injection.matcher(props)) {
					props = { ...props };

					const children = Array.isArray(props.children) ? [...props.children] : props.children ? [props.children] : [];

					const position = injection.position ?? "end";
					if (position === "start") {
						children.unshift(injection.component);
					} else if (position === "end") {
						children.push(injection.component);
					} else if (typeof position === "number") {
						children.splice(position, 0, injection.component);
					}

					props.children = children;
				}
			}
		}

		return originalJsxs(type, props, ...rest);
	};

	jsxRuntime.jsx = function (type: any, props: any, ...rest: any[]) {
		if (props && injections.size > 0) {
			for (const injection of injections) {
				if (injection.matcher(props)) {
					props = { ...props };
					const existingChild = props.children;
					const children = existingChild ? [existingChild] : [];

					const position = injection.position ?? "end";
					if (position === "start") {
						children.unshift(injection.component);
					} else {
						children.push(injection.component);
					}

					props.children = children;
				}
			}
		}

		return originalJsx(type, props, ...rest);
	};

	unloads.add(() => {
		jsxRuntime.jsx = originalJsx;
		jsxRuntime.jsxs = originalJsxs;
	});

	return true;
};

/**
 * Inject a component into a target element matching the provided matcher function.
 *
 * @example
 * ```tsx
 * // Inject into moreContainer (the buttons to the right of the player)
 * injectComponent(unloads, {
 *   matcher: (props) => props.className?.includes?.('moreContainer'),
 *   component: <MyCustomButton />,
 *   position: 'end'
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Inject by data-test attribute
 * injectComponent(unloads, {
 *   matcher: (props) => props['data-test'] === 'footer-player',
 *   component: <MyComponent />,
 *   position: 'start'
 * });
 * ```
 */
export const injectComponent = (unloads: LunaUnloads, config: InjectionConfig): void => {
	injections.add(config);
	unloads.add(() => {
		injections.delete(config);
	});
};

/**
 * Helper matchers for common scenarios
 */
export const matchers = {
	/** Match by className (partial match) */
	byClassName: (className: string): ComponentMatcher => {
		return (props) => props?.className?.includes?.(className);
	},

	/** Match by data-test attribute */
	byDataTest: (dataTest: string): ComponentMatcher => {
		return (props) => props?.["data-test"] === dataTest;
	},

	/** Match by id */
	byId: (id: string): ComponentMatcher => {
		return (props) => props?.id === id;
	},

	/** Match by multiple className parts (all must match) */
	byClassNames: (...classNames: string[]): ComponentMatcher => {
		return (props) => classNames.every((cn) => props?.className?.includes?.(cn));
	},

	/** Match by custom property */
	byProp: (key: string, value: any): ComponentMatcher => {
		return (props) => props?.[key] === value;
	},
};

/**
 * Convenience function to inject into a container by className
 *
 * @example
 * ```tsx
 * injectIntoContainer(unloads, 'moreContainer', <MyButton />);
 * ```
 */
export const injectIntoContainer = (
	unloads: LunaUnloads,
	className: string,
	component: React.ReactNode,
	position?: InjectionPosition,
): void => {
	injectComponent(unloads, {
		matcher: matchers.byClassName(className),
		component,
		position,
	});
};
