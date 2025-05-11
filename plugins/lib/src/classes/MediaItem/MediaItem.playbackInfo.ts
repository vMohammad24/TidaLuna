import { parseDasha, type DashManifest } from "./dasha.native";

import type { MediaItemAudioQuality } from "../Quality";
import { TidalApi } from "../TidalApi";
import type { PlaybackInfoResponse } from "../TidalApi/types/PlaybackInfo";
import type { MediaItem } from "./MediaItem";

interface PlaybackInfoBase extends Omit<PlaybackInfoResponse, "manifest"> {
	mimeType: string;
}

export type TidalManifest = {
	mimeType: string;
	codecs: string;
	encryptionType: string;
	keyId: string;
	urls: string[];
};
interface TidalPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/vnd.tidal.bts";
	manifest: TidalManifest;
}
interface DashPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/dash+xml";
	manifest: DashManifest;
}
export type PlaybackInfo = DashPlaybackInfo | TidalPlaybackInfo;

export const getPlaybackInfo = async (mediaItem: MediaItem, audioQuality: MediaItemAudioQuality): Promise<PlaybackInfo> => {
	try {
		const playbackInfo = await TidalApi.playbackInfo(mediaItem.id, audioQuality);

		switch (playbackInfo.manifestMimeType) {
			case "application/vnd.tidal.bts": {
				const manifest: TidalManifest = JSON.parse(atob(playbackInfo.manifest));
				return { ...playbackInfo, manifestMimeType: playbackInfo.manifestMimeType, manifest, mimeType: manifest.mimeType };
			}
			case "application/dash+xml": {
				const manifest = await parseDasha(atob(playbackInfo.manifest), "https://sp-ad-cf.audio.tidal.com");
				return { ...playbackInfo, manifestMimeType: playbackInfo.manifestMimeType, manifest, mimeType: "audio/mp4" };
			}
			default: {
				throw new Error(`Unsupported Stream Info manifest mime type: ${playbackInfo.manifestMimeType}`);
			}
		}
	} catch (e) {
		throw new Error(`Failed to get playbackInfo! ${(<Error>e)?.message}`);
	}
};
