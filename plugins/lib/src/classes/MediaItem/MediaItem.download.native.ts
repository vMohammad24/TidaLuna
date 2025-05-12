import type { PlaybackInfo } from "../../helpers";
import type { MetaTags } from "./MediaItem.tags";

import { fetchMediaItemStream, type FetchProgress } from "@luna/lib.native";

import { createWriteStream, type PathLike } from "fs";
import { access, constants } from "fs/promises";

const exists = (path: PathLike) =>
	access(path, constants.F_OK)
		.then(() => true)
		.catch(() => false);

const pathSeparator = process.platform === "win32" ? "\\" : "/";

const downloadProgress: Record<string, FetchProgress> = {};
export const download = async (playbackInfo: PlaybackInfo, path: string, tags?: MetaTags): Promise<void> => {
	// if (downloadStatus[playbackInfo.] !== undefined) throw new Error(`Something is already downloading to ${pathKey}`);
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
		let stream = await fetchMediaItemStream(playbackInfo, { progress, tags });
		const writeStream = createWriteStream("C:\\Users\\Inrixia\\Downloads\\test.flac");
		return new Promise((res, rej) => stream.pipe(writeStream).on("finish", res).on("error", rej));
	} finally {
		delete downloadProgress[playbackInfo.trackId];
	}
};
export const getDownloadProgress = (filePath: string) => downloadProgress[filePath];
