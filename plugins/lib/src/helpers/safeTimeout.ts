import type { LunaUnload } from "@luna/core";
import type { NullishUnloads } from "../redux";

export const safeTimeout = (unloads: NullishUnloads, cb: () => void, delay?: number): LunaUnload => {
	const timeout = setTimeout(cb, delay);
	const unload: LunaUnload = () => clearTimeout(timeout);
	unloads?.add(unload);
	unload.source = "safeTimeout";
	return unload;
};

export const safeInterval = (unloads: NullishUnloads, cb: () => void, delay?: number): LunaUnload => {
	const interval = setInterval(cb, delay);
	const unload: LunaUnload = () => clearInterval(interval);
	unloads?.add(unload);
	unload.source = "safeInterval";
	return unload;
};
