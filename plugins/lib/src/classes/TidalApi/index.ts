import { type Tracer } from "@luna/core";

import { memoize, memoizeArgless, Semaphore, statusOK, type Memoized, type VoidLike } from "@inrixia/helpers";

import type { TApiTrack, TApiTracks } from "./types/Tracks";

import { getCredentials } from "../../helpers";
import { libTrace } from "../../index.safe";
import * as redux from "../../redux";

import type { ItemId, TAlbum, TArtist, TLyrics, TMediaItem, TPlaylist, TTrackItem } from "../../outdated.types";
import type { MediaItemAudioQuality } from "../Quality";
import { PlaybackInfoResponse } from "./types/PlaybackInfo";

export * from "./types";

export class TidalApi {
	public static trace: Tracer = libTrace.withSource("TidalApi").trace;

	public static async getAuthHeaders() {
		const { clientId, token } = await getCredentials();
		return {
			Authorization: `Bearer ${token}`,
			"x-tidal-token": clientId,
		};
	}
	public static readonly queryArgs: Memoized<() => string> = memoizeArgless(() => {
		const store = redux.store.getState();
		return `countryCode=${store.session.countryCode}&deviceType=DESKTOP&locale=${store.settings.language}`;
	});
	public static fetch = memoize(async <T>(url: string): Promise<T | undefined> => {
		const res = await fetch(url, {
			headers: await this.getAuthHeaders(),
		});
		if (statusOK(res.status)) return res.json();
		if (res.status === 404) return undefined;
		this.trace.err.withContext(url).throw(`${res.status} ${res.statusText}`);
	});

	public static async track(trackId: ItemId) {
		return this.fetch<TTrackItem>(`https://desktop.tidal.com/v1/tracks/${trackId}?${this.queryArgs()}`);
	}

	// Lock to two concurrent requests
	private static readonly playbackInfoSemaphore = new Semaphore(2);
	public static playbackInfo(trackId: ItemId, audioQuality: MediaItemAudioQuality) {
		return this.playbackInfoSemaphore.with(() =>
			this.fetch<PlaybackInfoResponse>(
				`https://desktop.tidal.com/v1/tracks/${trackId}/playbackinfo?audioquality=${audioQuality}&playbackmode=STREAM&assetpresentation=FULL`,
			),
		);
	}

	public static async lyrics(trackId: ItemId) {
		return this.fetch<TLyrics>(`https://desktop.tidal.com/v1/tracks/${trackId}/lyrics?${this.queryArgs()}`);
	}
	public static async artist(artistId: ItemId) {
		return this.fetch<TArtist>(`https://desktop.tidal.com/v1/artists/${artistId}?${this.queryArgs()}`);
	}

	public static async album(albumId: ItemId) {
		return this.fetch<TAlbum>(`https://desktop.tidal.com/v1/albums/${albumId}?${this.queryArgs()}`);
	}
	public static async albumItems(albumId: ItemId) {
		return this.fetch<{ items: TMediaItem[]; totalNumberOfItems: number; offset: number; limit: -1 }>(
			`https://desktop.tidal.com/v1/albums/${albumId}/items?${this.queryArgs()}&limit=-1`,
		);
	}

	public static playlist(playlistUUID: ItemId) {
		return this.fetch<TPlaylist>(`https://desktop.tidal.com/v1/playlists/${playlistUUID}?${this.queryArgs()}`);
	}
	public static async playlistItems(playlistUUID: ItemId) {
		return this.fetch<{ items: TMediaItem[]; totalNumberOfItems: number; offset: number; limit: -1 }>(
			`https://desktop.tidal.com/v1/playlists/${playlistUUID}/items?${this.queryArgs()}&limit=-1`,
		);
	}

	public static async *isrc(isrc: string): AsyncIterable<TApiTrack> {
		let resp = await this.fetch<TApiTracks | VoidLike>(`https://openapi.tidal.com/v2/tracks?${this.queryArgs()}&filter[isrc]=${isrc}`);
		while (true) {
			if (resp?.data === undefined || resp.data.length === 0) break;
			yield* resp.data;
			if (resp.links.next === undefined) break;
			resp = await this.fetch<TApiTracks>(`https://openapi.tidal.com/v2/${resp.links.next}`).catch(
				this.trace.err.withContext(`Unexpected error when fetching Tidal ISRC ${isrc}`),
			);
		}
	}
}
