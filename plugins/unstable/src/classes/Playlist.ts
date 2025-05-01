import { asyncDebounce } from "@inrixia/helpers";
import { ContentBase } from "./ContentBase";

import { MediaItem } from "./MediaItem/MediaItem";

import type { Tracer } from "@luna/core";
import { redux, type ItemId, type TMediaItem, type TPlaylist } from "@luna/lib";
import { unloads, uTrace } from "../window.unstable";
import type { MediaCollection } from "./MediaCollection";

export class Playlist extends ContentBase implements MediaCollection {
	public readonly trace: Tracer;
	constructor(
		public readonly uuid: ItemId,
		public readonly tidalPlaylist: TPlaylist,
	) {
		super();
		this.trace = uTrace.withSource(`.Playlist[${tidalPlaylist.title ?? uuid}]`).trace;
	}

	public static async fromId(playlistUUID?: ItemId) {
		if (playlistUUID === undefined) return;
		// TODO: Add with TidalApi call
		return super.fromStore(playlistUUID, "playlists", this);
	}

	public async title() {
		return this.tidalPlaylist.title;
	}

	public async mediaItemsCount() {
		return (await this.tMediaItems()).length;
	}
	public async mediaItems() {
		return MediaItem.fromTMediaItems(await this.tMediaItems());
	}
	public tMediaItems: () => Promise<TMediaItem[]> = asyncDebounce(async () => {
		// TODO: Replace with TidalApi call
		const result: any = await redux
			.interceptActionResp(
				() => redux.actions["content/LOAD_LIST_ITEMS_PAGE"]({ loadAll: true, listName: `playlists/${this.uuid}`, listType: "mediaItems" }),
				unloads,
				["content/LOAD_LIST_ITEMS_PAGE_SUCCESS_MODIFIED"],
				["content/LOAD_LIST_ITEMS_PAGE_FAIL"],
			)
			.catch(this.trace.warn.withContext("tMediaItems.interceptActionResp", `playlists/${this.uuid}`, this));

		const tMediaItems: Immutable.List<TMediaItem> = result?.items;
		if (tMediaItems === undefined) return [];
		return Array.from(tMediaItems);
	});
}
