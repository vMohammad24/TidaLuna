import type { PlaybackInfo } from "@luna/lib";
import { Readable } from "stream";

import { makeDecipher } from "./decrypt";
import { fetchStream, type TrackStreamOptions } from "./fetchStream";

export const fetchTrackStream = async (
	{ manifestMimeType, manifest }: PlaybackInfo,
	options: Omit<TrackStreamOptions, "deciper">,
): Promise<Readable> => {
	switch (manifestMimeType) {
		case "application/vnd.tidal.bts": {
			return Readable.from(fetchStream(manifest.urls, { ...options, decipher: makeDecipher(manifest) }));
		}
		case "application/dash+xml": {
			const trackManifest = manifest.tracks.audios[0];
			return Readable.from(
				fetchStream(
					trackManifest.segments.map((segment) => segment.url),
					options,
				),
			);
		}
		default: {
			throw new Error(`Unsupported Stream Info manifest mime type: ${manifestMimeType}`);
		}
	}
};
