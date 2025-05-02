import { ActionTypes as OutdatedActionPayloads } from "neptune-types/tidal";

export type {
	ItemId,
	CoreState as OutdatedStoreState,
	Album as TAlbum,
	Artist as TArtist,
	ContentStateFields as TContentState,
	MediaItem as TMediaItem,
	Playlist as TPlaylist,
	PlayQueueItem as TPlayQueueItem,
	TrackItem as TTrackItem,
	VideoItem as TVideoItem,
} from "neptune-types/tidal";
export type { OutdatedActionPayloads };

export type TLyrics = OutdatedActionPayloads["content/LOAD_ITEM_LYRICS_SUCCESS"];
