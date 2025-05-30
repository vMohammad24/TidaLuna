import sanitize from "sanitize-filename";

import { createWriteStream } from "fs";
import { mkdir } from "fs/promises";
import { join, parse } from "path";

import { fetchMediaItemStream, type FetchProgress } from "@luna/lib.native";

// Type import & native space so not a issue
import type { redux } from "@luna/lib";

import type { PlaybackInfo } from "../../helpers";
import type { MetaTags } from "./MediaItem.tags";

const downloads: Record<redux.ItemId, { progress: FetchProgress; promise: Promise<void> } | undefined> = {};
export const downloadProgress = async (trackId: redux.ItemId) => downloads[trackId]?.progress;
export const download = async (playbackInfo: PlaybackInfo, path: string, tags?: MetaTags): Promise<void> => {
	if (downloads[playbackInfo.trackId] !== undefined) return downloads[playbackInfo.trackId]!.promise;
	try {
		const parsedPath = parse(path);
		await mkdir(parsedPath.dir, { recursive: true });
		const writeStream = createWriteStream(join(parsedPath.dir, sanitize(parsedPath.base)));

		const progress = { total: 0, downloaded: 0 };
		const stream = await fetchMediaItemStream(playbackInfo, {
			progress,
			tags,
		});

		const { resolve, reject, promise } = Promise.withResolvers<void>();
		downloads[playbackInfo.trackId] = { progress, promise };

		stream.pipe(writeStream).on("finish", resolve).on("error", reject);

		await promise;
	} finally {
		delete downloads[playbackInfo.trackId];
	}
};
