export * from "./index.safe";

export { ContextMenu } from "./classes/ContextMenu";
export { StyleTag } from "./classes/StyleTag";

export * from "./helpers";
export * as redux from "./redux";

import { observePromise } from "./helpers/observable";

import { Tracer } from "@luna/core";

observePromise("div[class^='_mainContainer'] > div[class^='_bar'] > div[class^='_title']", 30000).then((title) => {
	if (title !== null) title.innerHTML = 'TIDA<b><span style="color: #32f4ff;">Luna</span></b>	<span style="color: red;">BETA</span>';
});

export const { trace: libTrace, errSignal } = Tracer("[@luna/lib]");
