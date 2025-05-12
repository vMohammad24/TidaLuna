import { registerEmitter, type AddReceiver, type MaybePromise, type VoidLike } from "@inrixia/helpers";

import type { Tracer } from "@luna/core";

import { libTrace, unloads } from "../index.safe";
import type { ItemId, OutdatedStoreState } from "../outdated.types";
import * as redux from "../redux";
import { MediaItem } from "./MediaItem";
import type { MediaItemAudioQuality } from "./Quality";

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

export type PlaybackControl = OutdatedStoreState["playbackControls"] & { playbackContext: PlaybackContext };
export type PlayQueue = OutdatedStoreState["playQueue"];
export type RepeatMode = "off" | "one" | "all";
export type PlaybackState = "IDLE" | "NOT_PLAYING" | "PLAYING" | "STALLED";

export class PlayState {
	/**
	 * The minimum duration of a track that needs to be played before it can be scrobbled.
	 * Defaults to 4 minutes in milliseconds
	 */
	public static readonly MIN_SCROBBLE_DURATION = 240000;
	/**
	 * The minimum percentage of a track that needs to be played before it can be scrobbled.
	 * Defaults to 0.5 (50%)
	 */
	public static readonly MIN_SCROBBLE_PERCENTAGE = 0.5;

	/**
	 * The total time the current track has been played in milliseconds
	 * Note: Can be longer than track duration, use `PlayState.playTime` to get the current play time
	 */
	public static cumulativePlaytime: number = 0;
	/**
	 * The time the last track started playing epoch ms
	 */
	public static lastPlayStart?: number;

	private static readonly trace: Tracer = libTrace.withSource(".PlayState").trace;

	public static get playbackControls(): PlaybackControl {
		return redux.store.getState().playbackControls;
	}
	public static get playQueue(): PlayQueue {
		return redux.store.getState().playQueue;
	}
	public static get playbackContext(): PlaybackContext {
		return this.playbackControls.playbackContext;
	}

	public static get state(): PlaybackState {
		return this.playbackControls.playbackState;
	}
	public static get desiredState(): PlaybackState {
		return this.playbackControls.desiredPlaybackState;
	}

	// #region Shuffle
	public static get shuffle(): boolean {
		return this.playQueue.shuffleModeEnabled;
	}
	public static setShuffle(shuffle: false, unshuffleItems?: boolean): void;
	public static setShuffle(shuffle: true, shuffleItems?: boolean): void;
	public static setShuffle(shuffle: boolean, shuffleItems: boolean = false): MaybePromise<VoidLike> {
		if (shuffleItems)
			return shuffle
				? redux.actions["playQueue/ENABLE_SHUFFLE_MODE_AND_SHUFFLE_ITEMS"]()
				: redux.actions["playQueue/DISABLE_SHUFFLE_MODE_AND_UNSHUFFLE_ITEMS"]();

		if (shuffle !== this.shuffle) shuffle ? redux.actions["playQueue/ENABLE_SHUFFLE_MODE"]() : redux.actions["playQueue/DISABLE_SHUFFLE_MODE"]();
	}
	// #endregion

	// #region Repeat
	public static get repeatMode(): RepeatMode {
		switch (this.playQueue.repeatMode) {
			case 0:
				return "off";
			case 1:
				return "all";
			case 2:
				return "one";
			default:
				this.trace.warn("Unknown repeat mode", this.playQueue.repeatMode);
				return "off";
		}
	}
	public static setRepeatMode(repeatMode: RepeatMode): void {
		switch (repeatMode.toLowerCase()) {
			case "off":
				redux.actions["playQueue/SET_REPEAT_MODE"](0);
				break;
			case "all":
				redux.actions["playQueue/SET_REPEAT_MODE"](1);
				break;
			case "one":
				redux.actions["playQueue/SET_REPEAT_MODE"](2);
				break;
		}
	}
	// #endregion

	// #region Playback
	public static get playing(): boolean {
		return this.desiredState === "PLAYING";
	}
	/**
	 * Play the current track, or a specific track if mediaItemId is provided.
	 * mediaItemId is not validated, you should use `MediaItem.play`
	 *
	 * If `mediaItemId` is provided, equivilent to:
	 * ```ts
	 * PlayState.playNext(mediaItemId);
	 * PlayState.next();
	 * PlayState.play();
	 * ```
	 */
	public static play(mediaItemId?: ItemId) {
		if (mediaItemId !== undefined) {
			this.playNext(mediaItemId);
			this.next();
		}
		redux.actions["playbackControls/PLAY"]();
	}
	public static pause() {
		redux.actions["playbackControls/PAUSE"]();
	}
	/**
	 * Skip to the next track
	 */
	public static next() {
		redux.actions["playQueue/MOVE_NEXT"]();
	}
	/**
	 * Skip to the previous track
	 */
	public static previous() {
		redux.actions["playQueue/MOVE_PREVIOUS"]();
	}
	/**
	 * Move to a specific track in the play queue
	 * @param playQueueIndex The index of the track in the play queue
	 */
	public static moveTo(playQueueIndex: number) {
		redux.actions["playQueue/MOVE_TO"](playQueueIndex);
	}
	/**
	 * Adds `mediaItemIds` to playQueue after current track as temporary items (removed after played)
	 */
	public static playNext(mediaItemIds: ItemId | ItemId[]) {
		mediaItemIds = Array.isArray(mediaItemIds) ? mediaItemIds : [mediaItemIds];
		redux.actions["playQueue/ADD_NEXT"]({ mediaItemIds, context: { type: "UNKNOWN" } });
	}
	/**
	 * Updeates PlayState.playQueue, note this may cause playback to restart
	 */
	public static updatePlayQueue(playQueue: Partial<PlayQueue>) {
		redux.actions["playQueue/RESET"]({
			...PlayState.playQueue,
			...playQueue,
		});
	}
	// #endregion

	// #region Seek
	public static get playTime() {
		return this.playbackControls.latestCurrentTime;
	}
	public static seek(time: number) {
		redux.actions["playbackControls/SEEK"](time);
	}
	// #endregion

	static {
		redux.intercept("playbackControls/SET_PLAYBACK_STATE", unloads, (state) => {
			switch (state) {
				case "PLAYING": {
					this.lastPlayStart = Date.now();
					break;
				}
				default: {
					if (this.lastPlayStart !== undefined) this.cumulativePlaytime += Date.now() - this.lastPlayStart;
					delete this.lastPlayStart;
				}
			}
		});
	}

	private static currentMediaItem?: MediaItem;
	/**
	 * `onScrobble` called with `MediaItem` when a track should be scrobbled according to `MIN_SCROBBLE_DURATION` and `MIN_SCROBBLE_PERCENTAGE`
	 */
	public static onScrobble: AddReceiver<MediaItem> = registerEmitter(async (onScrobble) => {
		this.currentMediaItem = await MediaItem.fromPlaybackContext();
		MediaItem.onMediaTransition(unloads, (mediaItem) => {
			// Dont use mediaItem as its the NEXT track not the one we just finished listening to
			if (this.currentMediaItem !== undefined && this.currentMediaItem.id !== mediaItem.id) {
				if (this.currentMediaItem.duration === undefined) return;
				if (this.lastPlayStart !== undefined) this.cumulativePlaytime += Date.now() - this.lastPlayStart;
				const longerThan4min = this.cumulativePlaytime >= this.MIN_SCROBBLE_DURATION;
				const minPlayTime = this.currentMediaItem.duration * this.MIN_SCROBBLE_PERCENTAGE * 1000;
				const moreThan50Percent = this.cumulativePlaytime >= minPlayTime;
				if (longerThan4min || moreThan50Percent) onScrobble(this.currentMediaItem, this.trace.err.withContext("onScrobble"));
			}
			this.currentMediaItem = mediaItem;
			// reset as we started playing a new one
			this.cumulativePlaytime = 0;
		});
	});

	public static onState: AddReceiver<PlaybackState> = registerEmitter((onState) =>
		redux.intercept<PlaybackState>("playbackControls/SET_PLAYBACK_STATE", unloads, (playbackState) =>
			onState(playbackState, this.trace.err.withContext("onState")),
		),
	);
}
