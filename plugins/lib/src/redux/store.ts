import { reduxStore } from "@luna/core";
import type { TidalStoreState } from "./types/store";

import type { Store } from "redux";

export const store: Store<TidalStoreState> = new Proxy({} as Store<TidalStoreState>, {
    get: (_target, prop) => {
        if (!reduxStore) return undefined;
        const val = reduxStore[prop as keyof Store<TidalStoreState>];
        return typeof val === "function" ? val.bind(reduxStore) : val;
    },
});
