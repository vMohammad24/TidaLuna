import { asyncDebounce, memoize } from "@inrixia/helpers";

import { ContentBase, type TImageSize } from "../ContentBase";
import { Quality, type MediaMetadataTag } from "../Quality";
import { makeTags, MetaTags } from "./MediaItem.tags";

import { fetchIsrcIterable, TidalApi } from "../../tidalApi";

import type { IRecording, ITrack } from "musicbrainz-api";

import { registerEmitter, type AddReceiver } from "@inrixia/helpers";
import { ftch, type Tracer } from "@luna/core";
import { redux, unloads, type ItemId, type TLyrics, type TMediaItem } from "@luna/lib";
import { intercept } from "plugins/lib/src/redux";
import { uTrace } from "../../window.unstable";
import { Album } from "../Album";
import { Artist } from "../Artist";
import { type PlaybackContext } from "../PlayState";

type MediaFormat = {
	bitDepth?: number;
	sampleRate?: number;
	codec?: string;
	duration?: number;
	bytes?: number;
	bitrate?: number;
};

export type TMediaItemBase = { item: { id?: ItemId }; type?: TMediaItem["type"] };

export class MediaItem extends ContentBase {
	// #region Static
	public static readonly trace: Tracer = uTrace.withSource(".MediaItem").trace;

	private static async fetchItem(itemId: ItemId, contentType: TMediaItem["type"]): Promise<TMediaItem | undefined> {
		// TODO: Implement video fetching
		if (contentType !== "track") return;
		const item = await TidalApi.track(itemId);
		if (item === undefined) return;
		return { item, type: contentType };
	}

	public static async fromId(itemId?: ItemId, contentType: TMediaItem["type"] = "track"): Promise<MediaItem | undefined> {
		if (itemId === undefined) return;
		return super.fromStore(itemId, "mediaItems", this, () => this.fetchItem(itemId, contentType));
	}
	public static async fromPlaybackContext(playbackContext?: PlaybackContext) {
		// This has to be here to avoid ciclic requirements breaking
		playbackContext ??= redux.store.getState().playbackControls.playbackContext;
		if (playbackContext?.actualProductId === undefined) return undefined;
		const mediaItem = await this.fromId(playbackContext.actualProductId, playbackContext.actualVideoQuality === null ? "track" : "video");
		// mediaItem?.setFormatAttrs({
		// 	bitDepth: playbackContext.bitDepth ?? undefined,
		// 	sampleRate: playbackContext.sampleRate ?? undefined,
		// 	duration: playbackContext.actualDuration ?? undefined,
		// 	codec: playbackContext.codec ?? undefined,
		// });
		return mediaItem;
	}
	public static async *fromIds(ids?: (ItemId | undefined)[]) {
		if (ids === undefined) return;
		for (const itemId of ids.filter((id) => id !== undefined)) {
			const mediaItem = await MediaItem.fromId(itemId);
			if (mediaItem !== undefined) yield mediaItem;
		}
	}
	public static async *fromTMediaItems(tMediaItems?: (TMediaItemBase | undefined)[]) {
		if (tMediaItems === undefined) return;
		for (const tMediaItem of tMediaItems.filter((tMediaItem) => tMediaItem !== undefined)) {
			const mediaItem = await MediaItem.fromId(tMediaItem.item.id, tMediaItem.type);
			if (mediaItem !== undefined) yield mediaItem;
		}
	}

	// Listeners
	public static onPreload: AddReceiver<MediaItem> = registerEmitter((emit) =>
		redux.intercept<{ productId?: string; productType?: "track" | "video" }>("player/PRELOAD_ITEM", unloads, async (item) => {
			if (item.productId === undefined) return MediaItem.trace.warn("player/PRELOAD_ITEM intercepted without productId!", item);
			const mediaItem = await this.fromId(item.productId, item.productType);
			if (mediaItem === undefined) return;
			mediaItem.preload();
			emit(mediaItem, mediaItem.trace.err.withContext("preloadItem.runListeners"));
		}),
	);
	public static onMediaTransition: AddReceiver<MediaItem> = registerEmitter((emit) =>
		intercept<{ playbackContext: PlaybackContext }>(
			"playbackControls/MEDIA_PRODUCT_TRANSITION",
			unloads,
			asyncDebounce(async ({ playbackContext }) => {
				const mediaItem = await this.fromPlaybackContext(playbackContext);
				if (mediaItem === undefined) return;
				// Always update format info on playback
				// if (this.useFormat) mediaItem.updateFormat();
				await emit(mediaItem, mediaItem.trace.err.withContext("mediaProductTransition.runListeners"));
			}),
		),
	);

	/** Warning! Not always called, dont rely on this over onMediaTransition */
	public static onPreMediaTransition: AddReceiver<MediaItem> = registerEmitter((emit) =>
		intercept<{ productId: ItemId; productType: TMediaItem["type"] }>(
			"playbackControls/PREFILL_MEDIA_PRODUCT_TRANSITION",
			unloads,
			asyncDebounce(async ({ mediaProduct: { productId, productType } }) => {
				const mediaItem = await this.fromId(productId, productType);
				if (mediaItem === undefined) return;
				mediaItem.preload();
				await emit(mediaItem, mediaItem.trace.err.withContext("prefillMPT.runListeners"));
			}),
		),
	);

	public static useTags: boolean = false;
	public static useMax: boolean = false;
	// public static useFormat: boolean = false;
	// #endregion

	public readonly tidalItem: Readonly<TMediaItem["item"]>;
	public readonly duration?: number;

	public readonly trace: Tracer;

	constructor(
		public readonly id: ItemId,
		tidalMediaItem: TMediaItem,
	) {
		super();
		this.tidalItem = tidalMediaItem.item;
		this.duration = this.tidalItem.duration;
		this.trace = MediaItem.trace.withSource(`[${this.tidalItem.title ?? id}]`).trace;
	}

	public album: () => Promise<Album | undefined> = memoize(async () => {
		if (this.tidalItem.album?.id) return Album.fromId(this.tidalItem.album?.id);
	});
	public artist: () => Promise<Artist | undefined> = memoize(async () => {
		if (this.tidalItem.artist?.id) return Artist.fromId(this.tidalItem.artist.id);
		if (this.tidalItem.artists?.[0]?.id) return Artist.fromId(this.tidalItem.artists?.[0].id);
		return (await this.album())?.artist();
	});
	public artists: () => Promise<Promise<Artist | undefined>[]> = memoize(async () => {
		if (this.tidalItem.artists) return this.tidalItem.artists.map((artist) => Artist.fromId(artist.id));
		return (await this.album())?.artists() ?? [];
	});

	public isrcs: () => Promise<Set<string>> = memoize(async () => {
		const isrcs = new Set<string>();
		const brainzItem = await this.brainzItem();
		if (brainzItem?.recording.isrcs) isrcs.add(brainzItem.recording.isrcs[brainzItem.recording.isrcs.length - 1]);

		if (this.tidalItem.isrc) isrcs.add(this.tidalItem.isrc);

		return isrcs;
	});
	public isrc: () => Promise<string | undefined> = memoize(async () => {
		for (const isrc of await this.isrcs()) return isrc;
	});

	public lyrics: () => Promise<TLyrics | undefined> = memoize(() => TidalApi.lyrics(this.id));

	public brainzItem: () => Promise<ITrack | undefined> = memoize(async () => {
		const releaseTrackFromRecording = async (recording: IRecording) => {
			// If a recording exists then fetch the full recording details including media for title resolution
			const release = await ftch
				.json<IRecording>(`https://musicbrainz.org/ws/2/recording/${recording.id}?inc=releases+media+artist-credits+isrcs&fmt=json`)
				.then(({ releases }) => releases?.filter((release) => release["text-representation"].language === "eng")[0] ?? releases?.[0])
				.catch(this.trace.warn.withContext("brainzItem.getISRCRecordings"));
			if (release === undefined) return undefined;

			const releaseTrack = release.media?.[0].tracks?.[0];
			releaseTrack.recording ??= recording;
			return releaseTrack;
		};

		if (this.tidalItem.isrc !== undefined) {
			// Lookup the recording from MusicBrainz by ISRC
			const recording = await ftch
				.json<{ recordings: IRecording[] }>(`https://musicbrainz.org/ws/2/isrc/${this.tidalItem.isrc}?inc=isrcs&fmt=json`)
				.then(({ recordings }) => recordings[0])
				.catch((err) => {
					if (err.message !== "Status code is 404") this.trace.warn.withContext("brainzItem.getISRCRecordings");
				});

			if (recording !== undefined) return releaseTrackFromRecording(recording);
		}

		const album = await this.album();
		const albumRelease = await album?.brainzRelease();
		if (albumRelease === undefined) return;

		const volumeNumber = (this.tidalItem.volumeNumber ?? 1) - 1;
		const trackNumber = (this.tidalItem.trackNumber ?? 1) - 1;

		let brainzItem = albumRelease?.media?.[volumeNumber]?.tracks?.[trackNumber];
		// If this is not the english version of the release try to find the english version of the release track
		if (albumRelease?.["text-representation"].language !== "eng" && brainzItem?.recording !== undefined) {
			return (await releaseTrackFromRecording(brainzItem.recording)) ?? brainzItem;
		}
		return brainzItem;
	});

	public get trackNumber(): number | undefined {
		return this.tidalItem.trackNumber;
	}
	public get volumeNumber(): number | undefined {
		return this.tidalItem.volumeNumber;
	}
	public get replayGainPeak(): number | undefined {
		return this.tidalItem.peak;
	}
	public get replayGain(): number | undefined {
		if (this.tidalItem.contentType !== "track") return;
		return this.tidalItem.replayGain;
	}
	public get url(): string | undefined {
		return this.tidalItem.url;
	}
	public get copyright(): string | undefined {
		if (this.tidalItem.contentType !== "track") return;
		return this.tidalItem.copyright;
	}
	public get bpm(): number | undefined {
		// @ts-expect-error BPM is now present on some tracks
		return this.tidalItem.bpm;
	}

	public get qualityTags(): Quality[] {
		if (this.tidalItem.contentType !== "track") return [];
		return Quality.fromMetaTags(this.tidalItem.mediaMetadata?.tags);
	}
	public get bestQuality(): Quality {
		if (this.tidalItem.contentType !== "track") {
			this.trace.warn("MediaItem quality called on non-track!", this);
			return Quality.High;
		}
		return Quality.max(
			...Quality.fromMetaTags(this.tidalItem.mediaMetadata?.tags),
			Quality.fromAudioQuality(this.tidalItem.audioQuality) ?? Quality.Lowest,
		);
	}

	public title: () => Promise<string | undefined> = memoize(async () => {
		const brainzItem = await this.brainzItem();
		return ContentBase.formatTitle(this.tidalItem.title, this.tidalItem.version, brainzItem?.title, brainzItem?.["artist-credit"]);
	});
	public releaseDate: () => Promise<Date | undefined> = memoize(async () => {
		let releaseDate = this.tidalItem.releaseDate ?? this.tidalItem.streamStartDate;
		if (releaseDate === undefined) {
			const brainzItem = await this.brainzItem();
			releaseDate = brainzItem?.recording?.["first-release-date"];
		}
		if (releaseDate === undefined) {
			const album = await this.album();
			releaseDate = album?.releaseDate;
			releaseDate ??= (await album?.brainzAlbum())?.date;
		}
		if (releaseDate) return new Date(releaseDate);
	});
	/**
	 * "year-month-day"
	 */
	public releaseDateStr: () => Promise<string | undefined> = memoize(async () => {
		return (await this.releaseDate())?.toISOString().slice(0, 10);
	});
	public coverUrl: (res?: TImageSize) => Promise<string | undefined> = memoize(async (res) => {
		if (this.tidalItem.album?.cover) return ContentBase.formatCoverUrl(this.tidalItem.album?.cover, res);
		const album = await this.album();
		return album?.coverUrl();
	});
	public brainzId: () => Promise<string | undefined> = memoize(async () => {
		const brainzItem = await this.brainzItem();
		return brainzItem?.recording.id;
	});

	public flacTags: () => Promise<MetaTags> = memoize(() => makeTags(this));

	public static fromIsrc: (isrc: string) => Promise<MediaItem | undefined> = memoize(async (isrc) => {
		let bestMediaItem: MediaItem | undefined = undefined;
		for await (const track of fetchIsrcIterable(isrc)) {
			// If quality is higher than current best, set as best
			const maxTrackQuality = Quality.max(...Quality.fromMetaTags(track.attributes.mediaTags as MediaMetadataTag[]));
			if (maxTrackQuality > (bestMediaItem?.bestQuality ?? Quality.Lowest)) {
				bestMediaItem = (await MediaItem.fromId(track.id)) ?? bestMediaItem;
				if ((bestMediaItem?.bestQuality ?? Quality.Lowest) >= Quality.Max) return bestMediaItem;
			}
		}
		return bestMediaItem;
	});
	public max: () => Promise<MediaItem | undefined> = memoize(async () => {
		if (this.bestQuality >= Quality.Max) return;

		const isrcs = await this.isrcs();
		if (isrcs.size === 0) return;

		let bestMediaItem: MediaItem = this;
		for (const isrc of isrcs) {
			const mediaItem = await MediaItem.fromIsrc(isrc);
			if (mediaItem && mediaItem?.bestQuality > bestMediaItem.bestQuality) {
				bestMediaItem = mediaItem;
				if (bestMediaItem.bestQuality >= Quality.Max) break;
			}
		}

		// Dont return self
		if (bestMediaItem.id === this.id) return undefined;
		return bestMediaItem;
	});

	// public playbackInfo: (audioQuality: MediaItemAudioQuality) => Promise<PlaybackInfo> = memoize(async (audioQuality) => {
	// 	const playbackInfo = await getPlaybackInfo(this, audioQuality);
	// 	// this.setFormatAttrs(playbackInfo);
	// 	return playbackInfo;
	// });

	// private static readonly formatStore: SharedObjectStoreExpirable<[trackId: number, audioQuality: MediaItemAudioQuality], MediaFormat> = new SharedObjectStoreExpirable("TrackInfoCache", {
	// 	storeSchema: {
	// 		keyPath: ["trackId", "audioQuality"],
	// 	},
	// 	maxAge: 24 * 6 * 60 * 1000,
	// });
	// private setFormatAttrs(mediaFormat: MediaFormat): void {
	// 	type N = number | undefined;

	// 	(this.bytes as N) = mediaFormat.bytes ?? this.bytes;
	// 	(this.bitDepth as N) = mediaFormat.bitDepth ?? this.bitDepth;
	// 	(this.sampleRate as N) = mediaFormat.sampleRate ?? this.sampleRate;
	// 	(this.duration as N) = mediaFormat.duration ?? this.duration;

	// 	(this.codec as string | undefined) = mediaFormat.codec ?? this.codec;

	// 	if (this.bytes && this.duration) (this.bitrate as number) ??= (this.bytes / this.duration) * 8;

	// 	runListeners(this, MediaItem.onFormatUpdateListeners, trace.err.withContext("setFormatAttrs.runListeners"));
	// }
	// private updateFormat: () => Promise<void> = asyncDebounce(async () => {
	// 	const playbackInfo = await this.playbackInfo();

	// 	const mediaFormat: MediaFormat = {};

	// 	if (this.bitDepth === undefined || this.sampleRate === undefined || this.duration === undefined) {
	// 		const { format, bytes } = await parseStreamMeta(playbackInfo);

	// 		mediaFormat.bytes = bytes;

	// 		mediaFormat.bitDepth = format.bitsPerSample ?? this.bitDepth;
	// 		mediaFormat.sampleRate = format.sampleRate ?? this.sampleRate;
	// 		mediaFormat.duration = format.duration ?? this.duration;

	// 		mediaFormat.codec = format.codec?.toLowerCase() ?? this.codec;

	// 		if (playbackInfo.manifestMimeType === "application/dash+xml") {
	// 			mediaFormat.bitrate = playbackInfo.manifest.tracks.audios[0].bitrate.bps ?? this.bitrate;
	// 			mediaFormat.bytes = playbackInfo.manifest.tracks.audios[0].size?.b ?? this.bytes;
	// 		}
	// 	} else {
	// 		mediaFormat.bytes = (await getStreamBytes(playbackInfo)) ?? this.bytes;
	// 	}

	// 	MediaItem.formatStore.put(mediaFormat).catch(trace.err.withContext("formatStore.put"));
	// 	this.setFormatAttrs(mediaFormat);
	// });
	// private loadFormat: () => Promise<void> = asyncDebounce(async () => {
	// 	const { value: mediaFormat } = await MediaItem.formatStore.getWithExpiry([+this.id, this.quality.audioQuality]);
	// 	if (mediaFormat) return this.setFormatAttrs(mediaFormat);
	// 	this.updateFormat();
	// });

	// public readonly bytes?: number;
	// public readonly sampleRate?: number;
	// public readonly bitDepth?: number;
	// public readonly codec?: string;
	// public readonly bitrate?: number;

	private preload() {
		if (MediaItem.useTags) this.flacTags();
		if (MediaItem.useMax) this.max();
		// if (MediaItem.useFormat) this.loadFormat();
	}
}
