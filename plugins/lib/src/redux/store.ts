import { findModuleByProperty } from "@luna/core";

import type { Store } from "redux";

export const store = findModuleByProperty<Store>("replaceReducer", "function");
