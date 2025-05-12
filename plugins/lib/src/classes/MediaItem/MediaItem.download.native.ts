import type { Readable } from "stream";
import type { PlaybackInfo } from "../../helpers";
import type { MetaTags } from "./MediaItem.tags";

import { rejectNotOk, toArrayBuffer } from "@inrixia/helpers";
import { fetchMediaItemStream, type FetchProgress } from "@luna/lib.native";
import { FlacStreamTagger, PictureType } from "flac-stream-tagger";
import { createWriteStream, type PathLike } from "fs";
import { access, constants } from "fs/promises";

const addTags = async ({ manifestMimeType, manifest }: PlaybackInfo, stream: Readable, metaTags: MetaTags) => {
	const { tags, coverUrl } = metaTags;
	if (manifestMimeType === "application/vnd.tidal.bts") {
		switch (manifest.codecs) {
			case "flac": {
				let picture;
				if (coverUrl !== undefined) {
					try {
						const arrayBuffer = await fetch(coverUrl).then(rejectNotOk).then(toArrayBuffer);
						picture = {
							pictureType: PictureType.FrontCover,
							buffer: Buffer.from(arrayBuffer),
						};
					} catch {}
				}
				return stream.pipe(
					new FlacStreamTagger({
						tagMap: tags,
						picture,
					}),
				);
			}
		}
	}
	return stream;
};

const exists = (path: PathLike) =>
	access(path, constants.F_OK)
		.then(() => true)
		.catch(() => false);

const pathSeparator = process.platform === "win32" ? "\\" : "/";

const downloadProgress: Record<string, FetchProgress> = {};
export const startDownload = async (playbackInfo: PlaybackInfo, metaTags?: MetaTags): Promise<void> => {
	// const pathKey = JSON.stringify(pathInfo);
	// if (downloadStatus[pathKey] !== undefined) throw new Error(`Something is already downloading to ${pathKey}`);
	try {
		// const folderPath = path.join(pathInfo.basePath ?? "", pathInfo.folderPath);
		// if (folderPath !== ".") await mkdir(folderPath, { recursive: true });
		// const fileName = `${folderPath}${pathSeparator}${pathInfo.fileName}`;
		// Dont download if exists
		// if (await exists(fileName)) {
		// 	delete downloadStatus[pathKey];
		// 	return Promise.resolve();
		// }
		const progress = (downloadProgress[playbackInfo.trackId] = { total: 0, downloaded: 0 });
		let stream = await fetchMediaItemStream(playbackInfo, { progress });
		if (metaTags) stream = await addTags(playbackInfo, stream, metaTags);
		const writeStream = createWriteStream("C:\\Users\\Inrixia\\Downloads\\test.flac");
		return new Promise((res, rej) => stream.pipe(writeStream).on("finish", res).on("error", rej));
	} finally {
		delete downloadProgress[playbackInfo.trackId];
	}
};
export const getDownloadProgress = (filePath: string) => downloadProgress[filePath];
