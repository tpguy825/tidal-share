import { readFile, writeFile } from "fs/promises";
import type { DspResponse, ExternalLink, IncludedAlbum, IncludedArtist, IncludedArtworks, RootObject } from "./types";

const token = { token: "", expires: -1 };

await loadSavedToken();

async function loadSavedToken() {
	try {
		const t = JSON.parse(await readFile("./token.json", "utf-8")) as typeof token;
		if (t && t.expires && t.token && t.expires < Math.floor(Date.now() / 1000)) {
			token.expires = t.expires;
			token.token = t.token;
		}
	} catch (e) {
		// console.log("No existing token found");
	}
}

export async function getToken(force = true) {
	if (!force && token.expires < Math.floor(Date.now() / 1000) && token.token !== "") return token.token;

	const t = await fetch("https://auth.tidal.com/v1/oauth2/token", {
		credentials: "omit",
		headers: {
			"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
			"Accept-Language": "en-US,en;q=0.9",
			"Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
			"Sec-GPC": "1",
			"Sec-Fetch-Dest": "empty",
			"Sec-Fetch-Mode": "cors",
			"Sec-Fetch-Site": "same-site",
			Priority: "u=4",
			Pragma: "no-cache",
			"Cache-Control": "no-cache",
		},
		body: "client_id=txNoH4kkV41MfH25&client_secret=dQjy0MinCEvxi1O4UmxvxWnDjt4cgHBPw8ll6nYBk98%3D&grant_type=client_credentials",
		method: "POST",
	}).then((r) => r.json() as Promise<null | { access_token?: string; expires_in?: number }>);

	if (!t || !t.access_token || !t.expires_in) throw new Error("invalid token returned: " + JSON.stringify(t));

	token.token = t.access_token;
	token.expires = Math.floor(Date.now() / 1000) + t.expires_in;

	await writeFile("./token.json", JSON.stringify(token));

	return t.access_token;
}

export async function get(id: number) {
	if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid id! Usage: bun tidal-share.ts <id>");

	const t = await getToken();

	return Promise.all([
		fetch(
			"https://openapi.tidal.com/v2/tracks/" + id + "?countryCode=GB&include=albums%2Cartists%2Calbums.coverArt",
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
					"Accept-Language": "en-US,en;q=0.9",
					authorization: "Bearer " + t,
					"Sec-GPC": "1",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-site",
					Priority: "u=4",
					Pragma: "no-cache",
					"Cache-Control": "no-cache",
				},
				referrer: "https://tidal.com/",
				method: "GET",
				mode: "cors",
			},
		).then((r) => r.json() as Promise<RootObject>),
		fetch(
			"https://openapi.tidal.com/v2/dspSharingLinks?filter%5Bsubject.id%5D=" +
				id +
				"&filter%5Bsubject.type%5D=tracks",
			{
				headers: {
					"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
					"Accept-Language": "en-US,en;q=0.9",
					authorization: "Bearer " + t,
					"Sec-GPC": "1",
					"Sec-Fetch-Dest": "empty",
					"Sec-Fetch-Mode": "cors",
					"Sec-Fetch-Site": "same-site",
					Priority: "u=4",
					Pragma: "no-cache",
					"Cache-Control": "no-cache",
				},
				referrer: "https://tidal.com/",
				method: "GET",
				mode: "cors",
			},
		).then((r) => r.json() as Promise<DspResponse>),
	] as const);
}

const externals: Record<string, string> = {
	TIDAL_SHARING: "Open in TIDAL",
	FACEBOOK: "Facebook",
	INSTAGRAM: "Instagram",
	OFFICIAL_HOMEPAGE: "Website",
	TIKTOK: "TikTok",
	TWITTER: "Twitter",
	YOUTUBE: "YouTube",
};
const prov_dict: Record<string, string> = {
	amazonMusic: "Amazon Music",
	spotify: "Spotify",
	youTubeMusic: "YouTube Music",
	appleMusic: "Apple Music",
} as const;

if (import.meta.main) await test(Number(process.argv[2]));

// writeFileSync("out.json", JSON.stringify(, null, "\t"));
async function test(id: number) {
	const [
		{
			included,
			data: { attributes: attrs },
		},
		dsp,
	] = await get(id);
	const albums = included.find((t): t is IncludedAlbum => t.type == "albums"),
		artists = included.filter((t): t is IncludedArtist => t.type == "artists"),
		artworks = included.find((t): t is IncludedArtworks => t.type == "artworks");
	if (!artists) throw new Error("No artist found!");
	console.log(
		attrs.title + (attrs.explicit ? " [E]" : ""),
		"by",
		artists
			.map((r) => r.attributes.name)
			.reverse()
			.join(", "),
		"-",
		d(attrs.duration),
		"-",
		attrs.bpm,
		"bpm",
		attrs.key,
		attrs.keyScale,
		"- ISRC:",
		attrs.isrc,
	);

	console.log(
		"\nAvailable qualities: Low" +
			(attrs.mediaTags.includes("LOSSLESS") ? ", HiFi" : "") +
			(attrs.mediaTags.includes("HIRES_LOSSLESS") ? ", Max" : ""),
	);

	if (albums) {
		console.log("\nAlbum [" + albums.attributes.type + "]:");
		console.log(
			`${albums.attributes.title}${albums.attributes.explicit ? " [E]" : ""} - Released ${albums.attributes.releaseDate} - ${albums.attributes.numberOfItems} songs - ${d(albums.attributes.duration)} - Barcode: ${albums.attributes.barcodeId}`,
		);
		console.log("Open in TIDAL: https://tidal.com/browse/album/" + albums.id);

		if (artworks)
			console.log(
				"Cover image:",
				artworks.attributes.files.sort((b, a) => a.meta.height * a.meta.width - b.meta.height * b.meta.width)[0]
					?.href,
			);
	}

	console.log("\nArtist links:");
	for (const a of artists) {
		console.log(a.attributes.name);
		for (const l of a.attributes.externalLinks) {
			console.log(link(l));
		}
	}

	const providers: Record<string, string[]> = {};

	for (const f of dsp.data) {
		for (const [prov, url] of Object.entries(f.attributes)) {
			if (prov in providers) providers[prov]!.push(url.href);
			else providers[prov] = [url.href];
		}
	}
	console.log("\nStreaming:");
	for (const [prov, urls] of Object.entries(providers)) {
		for (const u of urls) console.log("Listen on", (prov_dict[prov] ?? prov) + ":", u);
	}

	console.log("\nCopyright:", attrs.copyright.text);
	console.log("View online at https://tidal.com/track/" + id + "/u");
}

function d(time: string) {
	if (!time.startsWith("PT")) return "invalid time";
	return time.substring(2).replace("S", "s ").replace("M", "m ").replace("H", "h ").trim();
}

function link(l: ExternalLink) {
	let name = externals[l.meta.type] ?? "Other link";

	return ` - ${name}: ${l.href}`;
}

