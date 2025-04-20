export * from "./window.luna";

import type { VoidFn } from "@inrixia/helpers";
import { observe } from "./classes/Observable";

export { ContextMenu } from "./classes/ContextMenu";
export { observe } from "./classes/Observable";
export { StyleTag } from "./classes/StyleTag";
export { ErrorMessage, InfoMessage, Tracer, WarnMessage } from "./classes/Tracer";

export * as redux from "./redux";

export { Signal } from "@inrixia/helpers";

export interface LunaUnload extends VoidFn {
	source?: string;
}

observe.promise("div[class^='_mainContainer'] > div[class^='_bar'] > div[class^='_title']", 30000).then((title) => {
	if (title !== null) title.innerHTML = 'TIDA<b><span style="color: #32f4ff;">Luna</span></b>';
});
