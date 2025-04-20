import { observePromise } from "./helpers/observable";

export * from "./index.safe";

export { ContextMenu } from "./classes/ContextMenu";
export { StyleTag } from "./classes/StyleTag";
export { ErrorMessage, InfoMessage, WarnMessage } from "./classes/Tracer";

export * from "./helpers";
export * as redux from "./redux";

import { Signal } from "@inrixia/helpers";
import { Tracer } from "./classes/Tracer";

export { Signal, Tracer };

observePromise("div[class^='_mainContainer'] > div[class^='_bar'] > div[class^='_title']", 30000).then((title) => {
	if (title !== null) title.innerHTML = 'TIDA<b><span style="color: #32f4ff;">Luna</span></b>	<span style="color: red;">BETA</span>';
});

export const errSignal = new Signal<string | undefined>(undefined);
export const llTrace = Tracer("[Luna.lib]", errSignal);
