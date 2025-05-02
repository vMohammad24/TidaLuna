import { ftch, getCredentials, type Tracer } from "@luna/core";
import { redux, type ItemId, type TAlbum, type TArtist, type TLyrics, type TTrackItem } from "@luna/lib";

import type { VoidLike } from "@inrixia/helpers";

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

	public static getQueryArgs() {
		const store = redux.store.getState();
		return `countryCode=${store.session.countryCode}&deviceType=DESKTOP&locale=${store.settings.language}`;
	}
	public static async track(trackId: ItemId) {
		return ftch.json<TTrackItem>(`https://desktop.tidal.com/v1/tracks/${trackId}?${this.getQueryArgs()}`, {
			headers: await this.getAuthHeaders(),
		});
	}
	public static async lyrics(trackId: ItemId) {
		return ftch.json<TLyrics>(`https://desktop.tidal.com/v1/tracks/${trackId}/lyrics?${this.getQueryArgs()}`, {
			headers: await this.getAuthHeaders(),
		});
	}
	public static async album(albumId: ItemId) {
		return ftch.json<TAlbum>(`https://desktop.tidal.com/v1/albums/${albumId}?${this.getQueryArgs()}`, {
			headers: await this.getAuthHeaders(),
		});
	}
	public static async artist(artistId: ItemId) {
		return ftch.json<TArtist>(`https://desktop.tidal.com/v1/artists/${artistId}?${this.getQueryArgs()}`, {
			headers: await this.getAuthHeaders(),
		});
	}

	public static async *isrc(isrc: string): AsyncIterable<TApiTrack> {
		const headers = await this.getAuthHeaders();
		let resp = await ftch.json<TApiTracks | VoidLike>(`https://openapi.tidal.com/v2/tracks?${this.getQueryArgs()}&filter[isrc]=${isrc}`, {
			headers,
		});
		while (true) {
			if (resp?.data === undefined || resp.data.length === 0) break;
			yield* resp.data;
			if (resp.links.next === undefined) break;
			resp = await ftch
				.json<TApiTracks>(`https://openapi.tidal.com/v2/${resp.links.next}`, { headers })
				.catch(this.trace.err.withContext(`Unexpected error when fetching Tidal ISRC ${isrc}`));
		}
	}
}
