import type { AnyRecord } from "@inrixia/helpers";
import { createStore as createIdbStore, get as idbGet, keys as idbKeys, set as idbSet, type UseStore } from "idb-keyval";
import { store as obyStore } from "oby";
import { logErr } from "./helpers/console.js";

export class ReactiveStore<T extends AnyRecord> {
	public static Storages: Record<string, ReactiveStore<AnyRecord>> = {};
	public static getStore<T extends AnyRecord>(name: string): ReactiveStore<T> {
		return (this.Storages[name] ??= new this<T>(name));
	}

	public readonly idbStore: UseStore;
	private constructor(public readonly idbName: string) {
		this.idbStore = createIdbStore(idbName, "_");
	}

	private readonly storeCache: Record<string, T> = {};
	public async get(key: string): Promise<T> {
		if (key in this.storeCache) return this.storeCache[key];

		// Create the oby reactive object
		const reactiveObj = obyStore(<T>{});
		// Reconcile the object with the idb store to ensure we have the latest values
		obyStore.reconcile(reactiveObj, (await idbGet<T>(key, this.idbStore)) ?? {});

		// Set up a listener to write to the idb store when the object changes
		obyStore.on(reactiveObj, () => {
			const unwrappedObj = obyStore.unwrap(reactiveObj);
			idbSet(key, unwrappedObj, this.idbStore).catch((err) => {
				logErr(`Failed to write Storage.${this.idbName}.${key} = `, unwrappedObj, err);
			});
		});

		return (this.storeCache[key] = reactiveObj);
	}

	public set(key: string, value: T) {
		obyStore.reconcile(this.storeCache[key], value);
	}

	public keys(): Promise<string[]> {
		return idbKeys(this.idbStore);
	}
}
