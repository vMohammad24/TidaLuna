import { reduxStore, type Store } from "@luna/core";
import type { TidalStoreState } from "./types/store";

export const store: Store<TidalStoreState> = reduxStore;
