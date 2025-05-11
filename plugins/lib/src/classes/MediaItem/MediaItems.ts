import type { ItemId } from "neptune-types/tidal";
import type { MediaCollection } from "../MediaCollection";
import type { TMediaItemBase } from "./MediaItem";
import { MediaItem } from "./MediaItem";

export class MediaItems implements MediaCollection {
	private constructor(public readonly tMediaItems: TMediaItemBase[]) {}

	public static fromIds(itemIds: ItemId[]) {
		return new this(itemIds.map((id) => ({ item: { id }, type: "track" })));
	}
	public static fromTMediaItems(tMediaItems: TMediaItemBase[]) {
		return new this(tMediaItems);
	}

	public async title() {
		for await (const mediaItem of await this.mediaItems()) {
			return mediaItem.tidalItem.title;
		}
	}

	public async count() {
		return this.tMediaItems.length;
	}
	public async mediaItems() {
		return MediaItem.fromTMediaItems(this.tMediaItems);
	}
}
