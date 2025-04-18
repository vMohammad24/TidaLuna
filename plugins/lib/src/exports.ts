export * from "./window.luna";

import type { VoidFn } from "@inrixia/helpers";

import { findModuleByProperty } from "./helpers/findModule";

export { findModuleByProperty, findModuleProperty } from "./helpers/findModule";
export { actionTypes, type ActionType } from "./intercept.actionTypes";
export { intercept } from "./intercept.js";

export { ContextMenu } from "./classes/ContextMenu";
export { Page } from "./classes/Page";
export { StyleTag } from "./classes/StyleTag";
export { Tracer } from "./classes/Tracer";
export { React, ReactDom } from "./react";

export const redux = findModuleByProperty("replaceReducer", "function");

export interface LunaUnload extends VoidFn {
	source?: string;
}
