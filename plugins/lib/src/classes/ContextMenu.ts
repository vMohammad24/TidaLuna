import { registerEmitter, type AddReceiver } from "@inrixia/helpers";

import type { Tracer } from "@luna/core";

import { observePromise } from "../helpers/observable";
import { libTrace, unloads } from "../index.safe";
import type { OutdatedActionPayloads } from "../outdated.types";
import { intercept } from "../redux/intercept";

export type ContextMenuElem = Element & { addButton: (text: string, onClick: (ev: MouseEvent) => unknown) => HTMLSpanElement };
export class ContextMenu {
	public static readonly trace: Tracer = libTrace.withSource(".ContextMenu").trace;

	protected static async getContextMenu() {
		const contextMenu = await observePromise<ContextMenuElem>(`[data-type="list-container__context-menu"]`, 1000);
		if (contextMenu !== null) {
			const templateButton = Array.from(contextMenu.children).find((child) => child.querySelector("a"));
			contextMenu.addButton = (text, onClick) => {
				if (templateButton === undefined) throw new Error("No buttons to clone off contextMenu found!");
				const newButton = templateButton.cloneNode(true) as Element;
				newButton.querySelector<HTMLAnchorElement>("a")!.href = "";
				const span = newButton.querySelector<HTMLSpanElement>("span")!;
				span.innerText = text;
				span.onclick = (e) => {
					e.preventDefault();
					onClick(e);
				};
				contextMenu.appendChild(newButton);
				return span;
			};
		}
		return contextMenu;
	}

	public static onOpen: AddReceiver<{ event: OutdatedActionPayloads["contextMenu/OPEN"]; contextMenu: ContextMenuElem }> = registerEmitter(
		(onOpen) => {
			intercept("contextMenu/OPEN", unloads, async (event) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onOpen({ event, contextMenu }, ContextMenu.trace.msg.err.withContext(".onOpen", event.type, contextMenu));
			});
		},
	);
}
