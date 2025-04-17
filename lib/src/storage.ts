import type { AnyRecord } from "@inrixia/helpers";
import { createStore as createIdbStore, set as idbSet } from "idb-keyval";
import { store as obyStore } from "oby";

// Create main ReactiveStorage idb store
const idbStore = createIdbStore(`__luna.storage`, "_");
/**
 * Create a new reactive object where writes are reflected into idb asynconously.
 */
const reactiveStorage = <T extends AnyRecord>(name: string, defaultValue: Partial<T> = {}) => {
	const reactiveStorage = obyStore(defaultValue);
	obyStore.on(reactiveStorage, () => {
		idbSet(name, obyStore.unwrap(reactiveStorage), idbStore);
	});
};

/**
 * Write through changes to idb on store value changing. Not read thread/instance safe
 */
export const storage = (window.luna.storage = new Proxy({} as Record<string, AnyRecord>, {
	set(target, key: string, newValue) {
		return Reflect.set(target, key, reactiveStorage(key, newValue));
	},
}));
