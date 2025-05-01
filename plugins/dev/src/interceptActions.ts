import { buildActions, unloadSet, type LunaUnload } from "@luna/core";

import { redux } from "@luna/lib";

function convertToUpperCaseWithUnderscores(str: string) {
	return str
		.replace(/([a-z0-9])([A-Z])/g, "$1_$2") // Convert camelCase to snake_case
		.toUpperCase(); // Convert to uppercase
}

const unloads = new Set<LunaUnload>();
export const startReduxLog = async (actionPath: RegExp, handler: redux.InterceptCallback<redux.ActionType>) => {
	const actionTypes = Object.keys(buildActions).filter((actionType) => actionPath.test(actionType)) as redux.ActionType[];
	redux.intercept(actionTypes, unloads, handler);
};
export const stopReduxLog = async () => unloadSet(unloads);
