import type * as ReactT from "react";
import type * as ReactDomT from "react-dom/client";

import { findModuleByProperty } from "../helpers/findModule.js";

export const React: typeof ReactT = findModuleByProperty<typeof ReactT>("createElement", "function");
export const ReactDom: typeof ReactDomT = findModuleByProperty<typeof ReactDomT>("createRoot", "function");
