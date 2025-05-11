import { TTrackItem } from "../../../outdated.types";

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
