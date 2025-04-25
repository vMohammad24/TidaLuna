import type { Tracer } from "@luna/core";
import { redux, type ItemId, type TArtist } from "@luna/lib";
import { unloads, uTrace } from "../window.unstable";
import { ContentBase, type TImageSize } from "./ContentBase";

export class Artist extends ContentBase {
	constructor(
		public readonly id: ItemId,
		public readonly tidalArtist: TArtist,
	) {
		super();
	}

	public static readonly trace: Tracer = uTrace.withSource(".Artist").trace;

	public static async fromId(artistId?: ItemId): Promise<Artist | undefined> {
		if (artistId === undefined) return;
		const album = super.fromStore(artistId, "artists", this);
		if (album !== undefined) return album;

		await redux
			.interceptActionResp(() => redux.actions["content/LOAD_ARTIST"]({ artistId }), unloads, ["content/LOAD_ARTIST_SUCCESS"])
			.catch(Artist.trace.warn.withContext("fromId", artistId));

		return super.fromStore(artistId, "artists", this);
	}

	public coverUrl(res?: TImageSize) {
		if (this.tidalArtist.picture === undefined) return;
		return ContentBase.formatCoverUrl(this.tidalArtist.picture, res);
	}

	public get name() {
		return this.tidalArtist.name;
	}
}
