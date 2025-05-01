import { memoize, type VoidLike } from "@inrixia/helpers";

import type { IRelease, IReleaseMatch } from "musicbrainz-api";

import { Artist } from "./Artist";
import { ContentBase, type TImageSize } from "./ContentBase";
import { MediaItem } from "./MediaItem/MediaItem";

import { ftch, type Tracer } from "@luna/core";
import { redux, type ItemId, type TAlbum, type TMediaItem } from "@luna/lib";
import { TidalApi } from "../tidalApi";
import { unloads, uTrace } from "../window.unstable";
import type { MediaCollection } from "./MediaCollection";

export class Album extends ContentBase implements MediaCollection {
	public readonly trace: Tracer;
	constructor(
		public readonly id: ItemId,
		public readonly tidalAlbum: TAlbum,
	) {
		super();
		this.trace = Album.trace.withSource(`[${this.tidalAlbum.title ?? id}]`).trace;
	}

	public static readonly trace: Tracer = uTrace.withSource(".Album").trace;

	public static async fromId(albumId?: ItemId): Promise<Album | undefined> {
		if (albumId === undefined) return;
		return super.fromStore(albumId, "albums", this, () => TidalApi.album(albumId));
	}

	public brainzAlbum: () => Promise<IReleaseMatch | VoidLike> = memoize(async () => {
		if (this.tidalAlbum.upc === undefined) return;

		const brainzUrl = `https://musicbrainz.org/ws/2/release/?query=barcode:${this.tidalAlbum.upc}&fmt=json`;
		const brainzAlbum = await ftch
			.json<{ releases: IReleaseMatch[] }>(brainzUrl)
			.then(({ releases }) => releases[0])
			.catch(this.trace.warn.withContext("getUPCReleases"));

		// @ts-expect-error musicbrainz-api lib missing types
		const trackCount: number = brainzAlbum?.["track-count"];

		const brainzTrackCount = trackCount ?? brainzAlbum?.media?.reduce((count, album) => (count += album?.["track-count"] ?? 0), 0);

		// Try validate if the album is valid because sometimes tidal has the wrong upc id!
		if (brainzTrackCount !== undefined && this.tidalAlbum.numberOfTracks === brainzTrackCount) {
			return brainzAlbum;
		}

		if (brainzAlbum !== undefined) this.trace.warn("Invalid Tidal UPC for album!", brainzAlbum, this, brainzUrl);
	});

	public brainzRelease: () => Promise<IRelease | VoidLike> = memoize(async () => {
		const brainzAlbum = await this.brainzAlbum();
		if (brainzAlbum === undefined) return;
		return ftch
			.json<IRelease>(`https://musicbrainz.org/ws/2/release/${brainzAlbum.id}?inc=recordings+isrcs+artist-credits&fmt=json`)
			.catch(this.trace.warn.withContext("getReleaseAlbum"));
	});

	public artist: () => Promise<Artist | undefined> = memoize(async () => {
		if (this.tidalAlbum.artist?.id) return Artist.fromId(this.tidalAlbum.artist.id);
		if (this.tidalAlbum.artists?.[0]?.id) return Artist.fromId(this.tidalAlbum.artists?.[0].id);
	});
	public artists: () => Promise<Artist | undefined>[] = memoize(() => {
		return this.tidalAlbum.artists?.map((artist) => Artist.fromId(artist.id)) ?? [];
	});

	public async mediaItemsCount() {
		return (await this.tMediaItems()).length;
	}
	public async mediaItems() {
		return MediaItem.fromTMediaItems(await this.tMediaItems());
	}
	public tMediaItems: () => Promise<TMediaItem[]> = memoize(async () => {
		const result = await redux
			.interceptActionResp(
				() => redux.actions["content/LOAD_ALL_ALBUM_MEDIA_ITEMS"]({ albumId: this.tidalAlbum.id! }),
				unloads,
				["content/LOAD_ALL_ALBUM_MEDIA_ITEMS_SUCCESS"],
				["content/LOAD_ALL_ALBUM_MEDIA_ITEMS_FAIL"],
			)
			.catch(this.trace.warn.withContext("tMediaItems.interceptActionResp", this));
		const tMediaItems = <Immutable.List<TMediaItem>>result?.mediaItems;
		if (tMediaItems === undefined) return [];
		return Array.from(tMediaItems);
	});

	public coverUrl(res?: TImageSize) {
		if (this.tidalAlbum.cover === undefined) return;
		return ContentBase.formatCoverUrl(this.tidalAlbum.cover, res);
	}

	public title: () => Promise<string | undefined> = memoize(async () => {
		const brainzAlbum = await this.brainzAlbum();
		return ContentBase.formatTitle(this.tidalAlbum.title, this.tidalAlbum.version, brainzAlbum?.title, brainzAlbum?.["artist-credit"]);
	});

	public upc: () => Promise<string | undefined> = memoize(async () => {
		return this.tidalAlbum.upc ?? (await this.brainzAlbum())?.barcode;
	});

	public async brainzId(): Promise<string | undefined> {
		return (await this.brainzAlbum())?.id;
	}

	public get genre(): string | undefined {
		return this.tidalAlbum.genre;
	}
	public get recordLabel(): string | undefined {
		return this.tidalAlbum.recordLabel;
	}
	public get totalTracks(): number | undefined {
		return this.tidalAlbum.numberOfTracks;
	}
	public get releaseDate(): string | undefined {
		return this.tidalAlbum.releaseDate ?? this.tidalAlbum.streamStartDate;
	}
	public get releaseYear(): string | undefined {
		return this.tidalAlbum.releaseYear;
	}
}
