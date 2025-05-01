import { ftch, getCredentials } from "@luna/core";
import { redux, type ItemId, type TAlbum, type TArtist, type TLyrics, type TTrackItem } from "@luna/lib";

export * from "./auth";
export * from "./isrc";
export * from "./types";

export class TidalApi {
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
}
