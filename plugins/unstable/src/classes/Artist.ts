import type { Tracer } from "@luna/core";
import { type ItemId, type TArtist } from "@luna/lib";
import { TidalApi } from "../tidalApi";
import { uTrace } from "../window.unstable";
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
		return super.fromStore(artistId, "artists", this, () => TidalApi.artist(artistId));
	}

	public coverUrl(res?: TImageSize) {
		if (this.tidalArtist.picture === undefined) return;
		return ContentBase.formatCoverUrl(this.tidalArtist.picture, res);
	}

	public get name() {
		return this.tidalArtist.name;
	}
}
