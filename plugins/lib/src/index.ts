export * from "./index.safe";

export * from "./classes/ContextMenu";
export * from "./classes/StyleTag";

export * from "./helpers";
export * as ipcRenderer from "./ipc";
export * from "./outdated.types";
export * as redux from "./redux";

import { observePromise } from "./helpers/observable";

observePromise("div[class^='_mainContainer'] > div[class^='_bar'] > div[class^='_title']", 30000).then((title) => {
	if (title !== null) title.innerHTML = 'TIDA<b><span style="color: #32f4ff;">Luna</span></b>	<span style="color: red;">BETA</span>';
});

export { errSignal } from "./index.safe";
