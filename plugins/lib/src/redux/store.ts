import { findModuleByProperty } from "../helpers/findModule";

import type { Store } from "redux";

export const store = findModuleByProperty<Store>("replaceReducer", "function");
