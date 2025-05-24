import { registerEmitter, type AddReceiver } from "@inrixia/helpers";

import type { Tracer } from "@luna/core";

import { observePromise } from "../helpers";
import { libTrace, unloads } from "../index.safe";
import * as redux from "../redux";
import { Album } from "./Album";
import { MediaItems } from "./MediaItem";
import { Playlist } from "./Playlist";

export type ContextMenuElem = Element & { addButton: (text: string, onClick: (ev: MouseEvent) => unknown) => HTMLSpanElement };

export class ContextMenu {
	public static readonly trace: Tracer = libTrace.withSource(".ContextMenu").trace;

	/**
	 * Attempts to find the context menu element in the DOM with a 1s timeout.
	 * Will return null if the element is not found (usually means no context menu is open)
	 */
	public static async getCurrent() {
		const contextMenu = await observePromise<ContextMenuElem>(unloads, `[data-type="list-container__context-menu"]`, 1000);
		if (contextMenu !== null) {
			const templateButton = contextMenu.querySelector(`div[data-type="contextmenu-item"]`) as Element | undefined;
			contextMenu.addButton = (text, onClick) => {
				if (templateButton === undefined) throw new Error("No buttons to clone off contextMenu found!");
				const newButton = templateButton.cloneNode(true) as Element;
				newButton.querySelector<HTMLButtonElement>("button")!.removeAttribute("data-test");
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

	/**
	 *  Called with `contextMenu` when a context menu is opened
	 */
	public static onOpen: AddReceiver<{ event: redux.ActionPayloads["contextMenu/OPEN"]; contextMenu: ContextMenuElem }> = registerEmitter(
		(onOpen) => {
			redux.intercept("contextMenu/OPEN", unloads, async (event) => {
				const contextMenu = await ContextMenu.getCurrent();
				if (contextMenu === null) return;
				onOpen({ event, contextMenu }, ContextMenu.trace.msg.err.withContext(".onOpen", event.type, contextMenu));
			});
		},
	);

	/**
	 * Called with `contextMenu` and a `mediaCollection` when a media item or media collection (album, playlist etc) context menu is opened
	 */
	public static onMediaItem: AddReceiver<{ mediaCollection: MediaItems | Album | Playlist; contextMenu: ContextMenuElem }> = registerEmitter(
		(onMediaItem) => {
			redux.intercept(`contextMenu/OPEN_MEDIA_ITEM`, unloads, async (item) => {
				const contextMenu = await ContextMenu.getCurrent();
				if (contextMenu === null) return;
				onMediaItem(
					{ mediaCollection: MediaItems.fromIds([item.id]), contextMenu },
					ContextMenu.trace.err.withContext("onMediaItem.OPEN_MEDIA_ITEM", contextMenu),
				);
			});
			redux.intercept(`contextMenu/OPEN_MULTI_MEDIA_ITEM`, unloads, async (items) => {
				const contextMenu = await ContextMenu.getCurrent();
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
