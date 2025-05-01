import { memoize, type AnyRecord } from "@inrixia/helpers";
import { tidalModules } from "../exposeTidalInternals.js";
import { coreTrace } from "../trace/Tracer.js";

export interface FoundProperty<T> {
	value: T;
	path: (string | symbol)[];
}

export const findModuleProperty = memoize(<T>(propertyName: string, propertyType: string): FoundProperty<T> | undefined => {
	return recursiveSearch<T>(tidalModules, propertyName, propertyType);
});

export const findModuleByProperty = memoize(<T extends object>(propertyName: string, propertyType: string): T | undefined => {
	const foundProperty = recursiveSearch<T>(tidalModules, propertyName, propertyType);
	if (foundProperty === undefined) {
		coreTrace.warn("findModuleByProperty", `Module with property '${propertyName}' of type '${propertyType}' not found!`);
		return;
	}
	let module: object = tidalModules;
	// Remove the final path part
	foundProperty.path.pop();
	for (const key of foundProperty.path) module = module[key as keyof typeof module];
	return <T>module;
});

const recursiveSearch = <T>(
	obj: AnyRecord,
	propertyName: string,
	propertyType: string,
	seen = new Set<AnyRecord>(),
	path: (string | symbol)[] = [],
): FoundProperty<T> | undefined => {
	// Ignore window to avoid going out of bounds
	// Not ideal but this should only be called on module code anyway so blegh
	if (obj === window) return;
	if (seen.has(obj)) return;
	seen.add(obj);
	for (const key of getKeys(obj)) {
		try {
			const prop = obj[key];
			const currentPath = [...path, key];
			if (typeof prop === "object" && prop !== null) {
				const found = recursiveSearch<T>(<AnyRecord>prop, propertyName, propertyType, seen, currentPath);
				if (found !== undefined) return found;
			}
			if (key === propertyName && typeof prop === propertyType) {
				return { value: <T>prop, path: currentPath };
			}
		} catch {}
	}
};

const getKeys = (obj: AnyRecord) => {
	const keys = Object.keys(obj);
	if (keys.length !== 0) return keys;
	return Reflect.ownKeys(Object.getPrototypeOf(obj) ?? obj);
};
