import { memoize, type UnknownRecord } from "@inrixia/helpers";
import { tidalModules } from "../exposeTidalInternals.js";

export interface FoundProperty<T> {
	value: T;
	path: (string | symbol)[];
}

export const findModuleProperty = memoize(<T>(propertyName: string, propertyType: string): FoundProperty<T> | undefined => {
	return recursiveSearch<T>(tidalModules, propertyName, propertyType);
});

export const findModuleByProperty = memoize(<T extends object>(propertyName: string, propertyType: string): T | undefined => {
	const foundProperty = recursiveSearch<T>(tidalModules, propertyName, propertyType);
	if (foundProperty === undefined) return;
	let module: object = tidalModules;
	// Remove the final path part
	foundProperty.path.pop();
	for (const key of foundProperty.path) module = module[key as keyof typeof module];
	return <T>module;
});

const recursiveSearch = <T>(
	obj: UnknownRecord,
	propertyName: string,
	propertyType: string,
	seen = new Set<UnknownRecord>(),
	path: (string | symbol)[] = [],
): FoundProperty<T> | undefined => {
	if (seen.has(obj)) return;
	seen.add(obj);
	for (const key of getKeys(obj)) {
		try {
			const prop = obj[key];
			const currentPath = [...path, key];
			if (typeof prop === "object" && prop !== null) {
				const found = recursiveSearch<T>(<UnknownRecord>prop, propertyName, propertyType, seen, currentPath);
				if (found !== undefined) return found;
			}
			if (key === propertyName && typeof prop === propertyType) {
				return { value: <T>prop, path: currentPath };
			}
		} catch {}
	}
};

const getKeys = (obj: UnknownRecord) => {
	const keys = Object.keys(obj);
	if (keys.length !== 0) return keys;
	return Reflect.ownKeys(Object.getPrototypeOf(obj) ?? obj);
};
