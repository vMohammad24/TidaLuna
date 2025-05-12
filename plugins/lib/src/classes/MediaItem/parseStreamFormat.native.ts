// import { parseStream, type IAudioMetadata } from "music-metadata";

// import { requestTrackStream } from "@luna/lib.native";

// import type { PlaybackInfo } from "../../helpers";

// export const parseStreamFormat = async (playbackInfo: PlaybackInfo): Promise<{ format: IAudioMetadata["format"]; bytes?: number }> => {
// 	let bytes;
// 	// note that you cannot trust bytes to be populated until the stream is finished. parseStream will read the entire stream ensuring this
// 	const stream = await requestTrackStream(playbackInfo, { bytesWanted: 8192, onProgress: ({ total }) => (bytes = total) });
// 	const { format }: IAudioMetadata = await parseStream(stream, { mimeType: playbackInfo.mimeType });
// 	return { format, bytes };
// };
// export const getStreamBytes = async (playbackInfo: PlaybackInfo): Promise<number | undefined> => {
// 	let bytes;
// 	await requestTrackStream(playbackInfo, { requestOptions: { method: "HEAD" }, onProgress: ({ total }) => (bytes = total) });
// 	return bytes;
// };
