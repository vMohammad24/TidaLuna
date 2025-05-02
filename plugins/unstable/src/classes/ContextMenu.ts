import { registerEmitter, type AddReceiver } from "@inrixia/helpers";
import type { Tracer } from "@luna/core";
import { observePromise, redux, type OutdatedActionPayloads } from "@luna/lib";
import { unloads, uTrace } from "../window.unstable";
import { Album } from "./Album";
import { MediaItems } from "./MediaCollection";
import { Playlist } from "./Playlist";

type ExtendedElem = Element & { addButton: (text: string, onClick: (ev: MouseEvent) => unknown) => HTMLSpanElement };
export class ContextMenu {
	public static readonly trace: Tracer = uTrace.withSource(".ContextMenu").trace;

	private static async getContextMenu() {
		const contextMenu = await observePromise<ExtendedElem>(`[data-type="list-container__context-menu"]`, 1000);
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

	public static onOpen: AddReceiver<{ event: OutdatedActionPayloads["contextMenu/OPEN"]; contextMenu: ExtendedElem }> = registerEmitter(
		(onOpen) => {
			redux.intercept("contextMenu/OPEN", unloads, async (event) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onOpen({ event, contextMenu }, ContextMenu.trace.msg.err.withContext(".onOpen", event.type, contextMenu));
			});
		},
	);

	public static onMediaItem: AddReceiver<{ mediaCollection: MediaItems | Album | Playlist; contextMenu: ExtendedElem }> = registerEmitter(
		(onMediaItem) => {
			redux.intercept(`contextMenu/OPEN_MEDIA_ITEM`, unloads, async (item) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onMediaItem(
					{ mediaCollection: MediaItems.fromIds([item.id]), contextMenu },
					ContextMenu.trace.err.withContext("onMediaItem.OPEN_MEDIA_ITEM", contextMenu),
				);
			});
			redux.intercept(`contextMenu/OPEN_MULTI_MEDIA_ITEM`, unloads, async (items) => {
				const contextMenu = await ContextMenu.getContextMenu();
				if (contextMenu === null) return;
				onMediaItem(
					{ mediaCollection: MediaItems.fromIds(items.ids), contextMenu },
					ContextMenu.trace.err.withContext("onMediaItem.OPEN_MULTI_MEDIA_ITEM", contextMenu),
				);
			});
			ContextMenu.onOpen(unloads, async ({ event, contextMenu }) => {
				switch (event.type) {
					case "ALBUM": {
						const album = await Album.fromId(event.id);
						if (album === undefined) return;
						onMediaItem({ mediaCollection: album, contextMenu }, ContextMenu.trace.err.withContext(event.type, contextMenu));
						break;
					}
					case "PLAYLIST": {
						const playlist = await Playlist.fromId(event.id);
						if (playlist === undefined) return;
						onMediaItem({ mediaCollection: playlist, contextMenu }, ContextMenu.trace.err.withContext(event.type, contextMenu));
						break;
					}
				}
			});
		},
	);
}
