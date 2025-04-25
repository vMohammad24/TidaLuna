import { memoize, type VoidLike } from "@inrixia/helpers";
import { ftch } from "@luna/core";
import { uTrace } from "../window.unstable";
import { getToken } from "./auth";
import { TApiTrack, TApiTracks } from "./types";

const fetchTidal = memoize(async <T>(url: string) =>
	ftch.json<T>(url, {
		headers: {
			Authorization: `Bearer ${await getToken()}`,
			"Content-Type": "application/vnd.tidal.v1+json",
		},
	}),
);

const baseURL = "https://openapi.tidal.com/v2";

const irscTrace = uTrace.withSource("tidalApi.isrc").trace;

export async function* fetchIsrcIterable(isrc: string): AsyncIterable<TApiTrack> {
	let resp = await fetchTidal<TApiTracks | VoidLike>(`${baseURL}/tracks?countryCode=US&filter[isrc]=${isrc}`);
	while (true) {
		if (resp?.data === undefined || resp.data.length === 0) break;
		yield* resp.data;
		if (resp.links.next === undefined) break;
		resp = await fetchTidal<TApiTracks>(`${baseURL}${resp.links.next}`).catch(
			irscTrace.err.withContext(`Unexpected error when fetching Tidal ISRC ${isrc}`),
		);
	}
}
