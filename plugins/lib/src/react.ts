import type * as ReactT from "react";
import type * as ReactDomT from "react-dom/client";
import type * as ReactJSXRuntimeT from "react/jsx-runtime";

import { modules } from "@luna/core";
import { findModuleByProperty } from "./helpers/findModule.js";

export const React = findModuleByProperty<typeof ReactT>("createElement", "function");
modules["react"] = React;

export const ReactJSXRuntime = findModuleByProperty<typeof ReactJSXRuntimeT>("jsx", "function");
modules["react/jsx-runtime"] = ReactJSXRuntime;

export const ReactDom = findModuleByProperty<typeof ReactDomT>("createRoot", "function");
modules["react-dom"] = ReactDom;
