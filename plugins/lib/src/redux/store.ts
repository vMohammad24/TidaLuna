import { findModuleByProperty } from "@luna/core";

import type { Store } from "redux";

export const store: Store = <Store>findModuleByProperty("replaceReducer", "function");
