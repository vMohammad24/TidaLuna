import { observePromise } from "./helpers/observable";

export * from "./window.luna";

export { ContextMenu } from "./classes/ContextMenu";
export { StyleTag } from "./classes/StyleTag";
export { ErrorMessage, InfoMessage, Tracer, WarnMessage } from "./classes/Tracer";

export * from "./helpers";
export * as redux from "./redux";

export { Signal } from "@inrixia/helpers";

observePromise("div[class^='_mainContainer'] > div[class^='_bar'] > div[class^='_title']", 30000).then((title) => {
	if (title !== null) title.innerHTML = 'TIDA<b><span style="color: #32f4ff;">Luna</span></b>	<span style="color: red;">BETA</span>';
});
