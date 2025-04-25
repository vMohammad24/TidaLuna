import type { TTrackItem } from "@luna/lib";
import type { DashManifest } from "./streaming/dasha.native";

export type PlaybackInfoResponse = {
	trackId: number;
	assetPresentation: string;
	audioMode: NonNullable<TTrackItem["audioModes"]>;
	audioQuality: NonNullable<TTrackItem["audioQuality"]>;
	manifestMimeType: "application/vnd.tidal.bts" | "application/dash+xml";
	manifestHash: string;
	manifest: string;
	albumReplayGain: number;
	albumPeakAmplitude: number;
	trackReplayGain: number;
	trackPeakAmplitude: number;
	bitDepth: number;
	sampleRate: number;
};
export type TidalManifest = {
	mimeType: string;
	codecs: string;
	encryptionType: string;
	keyId: string;
	urls: string[];
};

interface PlaybackInfoBase extends Omit<PlaybackInfoResponse, "manifest"> {
	mimeType: string;
}

interface TidalPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/vnd.tidal.bts";
	manifest: TidalManifest;
}
interface DashPlaybackInfo extends PlaybackInfoBase {
	manifestMimeType: "application/dash+xml";
	manifest: DashManifest;
}
export type PlaybackInfo = DashPlaybackInfo | TidalPlaybackInfo;
