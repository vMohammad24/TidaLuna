import { parseDasha } from "./streaming/dasha.native";

import { getCredentials } from "@luna/lib";
import type { MediaItemAudioQuality } from "../Quality";
import type { MediaItem } from "./MediaItem";
import { PlaybackInfo, PlaybackInfoResponse, TidalManifest } from "./MediaItem.playbackInfo.types";

export const getPlaybackInfo = async (mediaItem: MediaItem, audioQuality: MediaItemAudioQuality): Promise<PlaybackInfo> => {
	try {
		const url = `https://desktop.tidal.com/v1/tracks/${mediaItem.id}/playbackinfo?audioquality=${audioQuality}&playbackmode=STREAM&assetpresentation=FULL`;

		const { clientId, token } = await getCredentials();
		const playbackInfo: PlaybackInfoResponse = await fetch(url, {
			headers: {
				Authorization: `Bearer ${token}`,
				"x-tidal-token": clientId,
			},
		}).then((r) => {
			if (r.status === 401) {
				mediaItem.trace.err.withContext("fetchPlaybackIinfo").throw(new Error("Invalid OAuth Access Token!"));
			}
			return r.json();
		});

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
