import { registerEmitter, type AddReceiver } from "@inrixia/helpers";
import { unloads, uTrace } from "../window.unstable";

import { MediaItem } from "./MediaItem/MediaItem";

import type { MediaItemAudioQuality } from "./Quality";

import type { Tracer } from "@luna/core";

import { redux, type OutdatedStoreState } from "@luna/lib";

export type PlaybackContext = {
	actualAssetPresentation: string;
	actualAudioMode: string;
	actualAudioQuality: MediaItemAudioQuality;
	actualDuration: number;
	actualProductId: string;
	actualStreamType: unknown;
	actualVideoQuality: unknown;
	assetPosition: number;
	bitDepth: number | null;
	codec: string;
	playbackSessionId: string;
	sampleRate: number | null;
};

type PlaybackControl = OutdatedStoreState["playbackControls"] & { playbackContext: PlaybackContext };

export class PlayState {
	public static readonly MIN_SCROBBLE_DURATION = 240000; // 4 minutes in milliseconds
	public static readonly MIN_SCROBBLE_PERCENTAGE = 0.5; // Minimum percentage of song duration required to scrobble
	public static trackPlayTime: number = 0;
	public static lastPlayStart?: number;

	public static readonly trace: Tracer = uTrace.withSource(".PlayState").trace;

	public static get playbackControls(): PlaybackControl {
		return redux.store.getState().playbackControls;
	}

	public static get playbackContext(): PlaybackContext {
		return this.playbackControls.playbackContext;
	}

	public static get state() {
		return this.playbackControls.playbackState;
	}
	public static get desiredState() {
		return this.playbackControls.desiredPlaybackState;
	}

	public static get paused(): boolean {
		return this.desiredState !== "PLAYING";
	}

	public static get latestCurrentTime() {
		return this.playbackControls.latestCurrentTime;
	}

	static {
		redux.intercept("playbackControls/SET_PLAYBACK_STATE", unloads, (state) => {
			switch (state) {
				case "PLAYING": {
					this.lastPlayStart = Date.now();
					break;
				}
				default: {
					if (this.lastPlayStart !== undefined) this.trackPlayTime += Date.now() - this.lastPlayStart;
					delete this.lastPlayStart;
				}
			}
		});
	}

	public static onScrobble: AddReceiver<MediaItem> = registerEmitter((onScrobble) =>
		MediaItem.onMediaTransition(unloads, (mediaItem) => {
			if (mediaItem.duration === undefined) return;
			if (this.lastPlayStart !== undefined) this.trackPlayTime += Date.now() - this.lastPlayStart;
			const longerThan4min = this.trackPlayTime >= this.MIN_SCROBBLE_DURATION;
			const minPlayTime = mediaItem.duration * this.MIN_SCROBBLE_PERCENTAGE * 1000;
			const moreThan50Percent = this.trackPlayTime >= minPlayTime;
			if (longerThan4min || moreThan50Percent) onScrobble(mediaItem, this.trace.err.withContext("onScrobble"));

			// reset as we started playing a new one
			this.trackPlayTime = 0;
		}),
	);
}
