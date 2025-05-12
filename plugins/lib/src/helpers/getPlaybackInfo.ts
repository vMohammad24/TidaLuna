import { parseDasha, type DashManifest } from "./getPlaybackInfo.dasha.native";

import type { MediaItemAudioQuality } from "../classes/Quality";
import { TidalApi } from "../classes/TidalApi";
import type { PlaybackInfoResponse } from "../classes/TidalApi/types/PlaybackInfo";
import { libTrace } from "../index.safe";
import type { ItemId } from "../outdated.types";

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

export const getPlaybackInfo = async (mediaItemId: ItemId, audioQuality: MediaItemAudioQuality): Promise<PlaybackInfo> => {
	try {
		const playbackInfo = await TidalApi.playbackInfo(mediaItemId, audioQuality);

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
		return libTrace.err.withContext("getPlaybackInfo", mediaItemId, audioQuality).throw(e);
	}
};
