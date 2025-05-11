import { ftch, type Tracer } from "@luna/core";
import { getCredentials, redux, type ItemId, type TAlbum, type TArtist, type TLyrics, type TTrackItem } from "@luna/lib";

import { Memo, memoize, type Memoized, type VoidLike } from "@inrixia/helpers";

import { uTrace } from "../window.unstable";
import type { TApiTrack, TApiTracks } from "./types/Tracks";

export * from "./types";

export class TidalApi {
	public static trace: Tracer = uTrace.withSource("TidalApi").trace;

	public static async getAuthHeaders() {
		const { clientId, token } = await getCredentials();
		return {
			Authorization: `Bearer ${token}`,
			"x-tidal-token": clientId,
		};
	}
	public static readonly queryArgs: Memoized<() => string> = Memo.argless(() => {
		const store = redux.store.getState();
		return `countryCode=${store.session.countryCode}&deviceType=DESKTOP&locale=${store.settings.language}`;
	});
	public static fetch = memoize(async <T>(url: string): Promise<T | undefined> => {
		const res = await fetch(url, {
			headers: await this.getAuthHeaders(),
		});
		if (ftch.statusOK(res.status)) return res.json();
		if (res.status === 404) return undefined;
		this.trace.err.withContext(url).throw(`${res.status} ${res.statusText}`);
	});

	public static async track(trackId: ItemId) {
		return this.fetch<TTrackItem>(`https://desktop.tidal.com/v1/tracks/${trackId}?${this.queryArgs()}`);
	}
	public static async lyrics(trackId: ItemId) {
		return this.fetch<TLyrics>(`https://desktop.tidal.com/v1/tracks/${trackId}/lyrics?${this.queryArgs()}`);
	}
	public static async album(albumId: ItemId) {
		return this.fetch<TAlbum>(`https://desktop.tidal.com/v1/albums/${albumId}?${this.queryArgs()}`);
	}
	public static async artist(artistId: ItemId) {
		return this.fetch<TArtist>(`https://desktop.tidal.com/v1/artists/${artistId}?${this.queryArgs()}`);
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
