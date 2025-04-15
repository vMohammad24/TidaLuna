import type { Store } from "redux";

import findModuleProperty from "./lib/findModuleProperty";
import patchAction from "./patchAction";

import { intercept, type InterceptCallback } from "./lib/intercept";

type LunaWindow = {
	findModuleProperty: typeof findModuleProperty;
	patchAction: typeof patchAction;
	interceptors: Record<string, Set<InterceptCallback>>;
	intercept: typeof intercept;

	// TODO: Properly type these
	store: Store;
	moduleCache: Record<string, any>;
	actions: Record<string, any>;
};

declare global {
	interface Window {
		luna: LunaWindow;
	}
	const luna: LunaWindow;
	const LunaNative: {
		invoke: (channel: string, ...args: any[]) => Promise<any>;
	};
}

const luna: LunaWindow = {
	findModuleProperty,
	patchAction,
	intercept,
	store: undefined,
	interceptors: {},
	moduleCache: {},
	actions: {},
};

export default window.luna = luna;
