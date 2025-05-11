import type { Tracer } from "@luna/core";

import { libTrace } from "../index.safe";
import type { ItemId, TArtist } from "../outdated.types";
import { ContentBase, type TImageSize } from "./ContentBase";
import { TidalApi } from "./TidalApi";

export class Artist extends ContentBase {
	constructor(
		public readonly id: ItemId,
		public readonly tidalArtist: TArtist,
	) {
		super();
	}

	public static readonly trace: Tracer = libTrace.withSource(".Artist").trace;

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
