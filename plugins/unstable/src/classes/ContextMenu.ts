import { registerEmitter, type AddReceiver } from "@inrixia/helpers";
import { redux } from "@luna/lib";
import { unloads } from "../window.unstable";
import { Album } from "./Album";
import { MediaItems } from "./MediaCollection";
import { Playlist } from "./Playlist";

import { ContextMenuElem, ContextMenu as ContextMenuLib } from "@luna/lib";

export class ContextMenu extends ContextMenuLib {
	public static onMediaItem: AddReceiver<{ mediaCollection: MediaItems | Album | Playlist; contextMenu: ContextMenuElem }> = registerEmitter(
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
