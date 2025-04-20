import { registerEmitter, type AddReceiver } from "@inrixia/helpers";
import { unloads } from "..";

import { observePromise } from "../helpers/observable";
import { intercept, type OutdatedActionPayloads } from "../redux";

type ExtendedElem = Element & { addButton: (text: string, onClick: (this: GlobalEventHandlers, ev: MouseEvent) => unknown) => HTMLSpanElement };
export class ContextMenu {
	private static async getContextMenu() {
		const contextMenu = await observePromise<ExtendedElem>(`[data-type="list-container__context-menu"]`, 1000);
		if (contextMenu !== null) {
			contextMenu.addButton = (text, onClick) => {
				const newButton = <Element>contextMenu.children[0].cloneNode(true);
				newButton.querySelector<HTMLAnchorElement>("a")!.href = "";
				const span = newButton.querySelector<HTMLSpanElement>("span")!;
				span.innerText = text;
				span.onclick = onClick;
				contextMenu.appendChild(newButton);
				return span;
			};
		}
		return contextMenu;
	}

	public static onOpen: AddReceiver<{ event: OutdatedActionPayloads["contextMenu/OPEN"]; contextMenu: ExtendedElem }> = registerEmitter(
		(onOpen) => {
			intercept("contextMenu/OPEN", unloads, async (event) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onOpen({ event, contextMenu }, () => {});
			});
		},
	);
}
