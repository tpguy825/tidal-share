import Elysia from "elysia";
import { get, getToken } from "./tidal-share";
import { base } from "./_utils";
import type { IncludedAlbum, IncludedArtist, IncludedArtworks } from "./types";
import crypto from "crypto";

// await Bun.$`bash css.sh`;

const app = new Elysia().get("/", "Add a TIDAL song ID to the url to use this service.");

async function file(path: string) {
	const a = "./assets/" + path,
		f = Bun.file(a),
		file = await f.bytes(),
		hash = `"` + crypto.createHash("sha256").update(file).digest("base64url") + `"`;
	app.get(a.substring(1), ({ headers, status }) => {
		console.log(headers);

		if (headers["if-none-match"] && headers["if-none-match"] == hash) return status(304);
		else
			return new Response(file, {
				headers: {
					ETag: hash,
					"Content-Type": f.type,
					"Last-Modified": new Date(f.lastModified).toUTCString(),
					"Cache-Control": "max-age=14400, public, must-revalidate",
				},
			});
	});
}

await Promise.all(["styles.css", "tidal.svg", "amazon.svg", "spotify.svg", "apple.svg", "yt.svg"].map(file));
// app.get("/assets/" + f, file("./assets/" + f));

app.get("/*", async ({ path, status }) => {
	console.log(path, path.substring(1).split("/").map(Number));

	const ids = path
		.split("/")
		.map(Number)
		.filter(Number.isSafeInteger)
		.filter((t) => t > 0);
	if (ids.length != 1) return status(400, "Invalid ID");
	else {
		try {
			console.log("Trying ID", ids);

			let data = await get(ids[0]!);
			if ("errors" in data[0] || "errors" in data[1]) {
				await getToken(true);
				data = await get(ids[0]!);

				if ("errors" in data[0] || "errors" in data[1])
					throw new Error("Invalid Tidal API response: " + JSON.stringify(data));
			}

			const [
				{
					included,
					data: { attributes: attrs },
				},
				dsp,
			] = data;

			const albums = included.find((t): t is IncludedAlbum => t.type == "albums"),
				artists = included.filter((t): t is IncludedArtist => t.type == "artists"),
				artworks = included.find((t): t is IncludedArtworks => t.type == "artworks");

			if (!artworks || !artists || !albums) throw new Error("Incomplete response! ID: " + ids[0]);

			const covers = artworks.attributes.files
				.sort((b, a) => a.meta.height * a.meta.width - b.meta.height * b.meta.width)
				.map((t) => [t.href, t.meta.height * t.meta.width] as const);

			const [cover, previewcover] = [covers[0]!, covers.filter(([, t]) => t >= 288 * 288).pop()];

			if (!cover || !previewcover) throw new Error("Incomplete response - covers not found - ID: " + ids[0]);

			const streams: Record<string, string> = {};

			for (const d of dsp.data) {
				for (const [p, l] of Object.entries(d.attributes)) {
					streams[p] = l.href;
				}
			}

			function artistcommas(els: JSX.Element[]) {
				if (els.length == 1) return els;
				return els.reduce<JSX.Element[]>(
					(pre, cur, i) => (i == 0 ? [cur] : [...pre, <span>, </span>, cur]),
					[],
				);
			}

			return base(
				// colour mixing hell
				// it works
				// do not touch
				<body
					style={{
						backdropFilter: "blur(40px) brightness(50%)",
						background: `no-repeat center/cover url('${previewcover[0]}')`,
						boxShadow: "0px 0px 100px 100px " + artworks.attributes.visualMetadata.selectedPaletteColor,
						backgroundColor: `color-mix(in hsl, ${artworks.attributes.visualMetadata.selectedPaletteColor}, #000000)`,
					}}
					class="min-h-screen content-center">
					{/* <div
						style={{
							background: `no-repeat center/max(100vh,100vw) url('${previewcover[0]}')`,
							zIndex: -1,
							filter: "blur(40px) brightness(25%)",
							boxShadow: "0px 0px 100px 100px " + artworks.attributes.visualMetadata.selectedPaletteColor,
							width: "100%",
							height: "100%",
						}}
						class="absolute top-0 left-0 opacity-75"></div> */}
					<div class="flex w-fit mx-auto flex-col md:flex-row gap-8 md:columns-2 my-4">
						<div class="flex flex-col rounded-lg border md:min-w-96 md:w-96 w-80 min-w-80 md:h-[446px]">
							<a href={cover[0]}>
								<img
									src={previewcover[0]}
									alt="Album cover"
									height="288"
									width="288"
									title="Click for the high resolution album cover"
									style={
										"box-shadow: 0px 0px 100px 24px " +
										artworks.attributes.visualMetadata.selectedPaletteColor
									}
									class="rounded-lg md:mx-12 md:mt-12 m-4"
								/>
							</a>
							<h1
								class={
									"z-10 mx-auto mb-1 max-w-72 w-72 text-center font-bold wrap-normal " +
									(attrs.title.length > 20
										? attrs.title.length > 35
											? "text-lg -mt-1"
											: "text-xl -mt-0.5"
										: "text-2xl")
								}
								safe>
								{attrs.title}
							</h1>
							<h2 class="z-10 mx-auto text-lg mb-4">
								{...artistcommas(
									artists.map((t) => (
										<a href={"https://tidal.com/artist/" + t.id} class="hover:underline" safe>
											{t.attributes.name}
										</a>
									)),
								)}
							</h2>
						</div>
						<div class="overflow-clip rounded-lg border md:h-[446px]">
							<h3 class="m-4 text-xl font-bold">Stream:</h3>
							<div class="flex flex-col gap-3 mb-4">
								<BaseStreamingService
									url={"https://tidal.com/track/" + ids[0]}
									name="Tidal"
									svgurl="/assets/tidal.svg"
									shadowcolour="220,220,220"
								/>
								{streams["spotify"] ? (
									<BaseStreamingService
										url={streams.spotify}
										name="Spotify"
										svgurl="/assets/spotify.svg"
										shadowcolour="30,215,96"
									/>
								) : (
									""
								)}

								{streams["appleMusic"] ? (
									<BaseStreamingService
										url={streams.appleMusic}
										name="Apple Music"
										svgurl="/assets/apple.svg"
										shadowcolour="254,68,92"
									/>
								) : (
									""
								)}
								{streams["youTubeMusic"] ? (
									<BaseStreamingService
										url={streams.youTubeMusic}
										name="YouTube Music"
										svgurl="/assets/yt.svg"
										shadowcolour="255,0,51"
									/>
								) : (
									""
								)}
								{streams["amazonMusic"] ? (
									<BaseStreamingService
										url={streams.amazonMusic}
										name="Amazon Music"
										svgurl="/assets/amazon.svg"
										shadowcolour="37,208,219"
									/>
								) : (
									""
								)}
							</div>
						</div>
					</div>
				</body>,
				<title safe>
					{attrs.title} - {artists.map((t) => t.attributes.name).join(", ")}
				</title>,
			);
		} catch (e) {
			console.error(e);
			return status(400, "Invalid ID - only songs are allowed");
		}
	}
});
app.listen(38483, ({ port }) => console.log("listening on http://localhost:" + port));

const rightArrow = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		width="24"
		height="24"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="2"
		stroke-linecap="round"
		stroke-linejoin="round"
		class="z-10 m-auto mr-4">
		<path d="m9 18 6-6-6-6" />
	</svg>
);

function BaseStreamingService({
	url,
	name,
	svgurl,
	shadowcolour,
}: {
	url: string;
	name: string;
	svgurl: string;
	shadowcolour: `${string},${string},${string}`;
}) {
	return (
		<div class="overflow-clip px-4 hover:overflow-visible">
			<a
				class="stream-link relative z-10 flex h-16 rounded-lg border select-none hover:cursor-pointer"
				href={url}
				target="_blank">
				<div
					class="glow absolute top-8 left-4 z-0 h-0 transition-opacity duration-300"
					style={
						"box-shadow: 0px 0px 56px 24px rgba(" + shadowcolour + ", 0.5); width: calc(100% - 32px);"
					}></div>
				<img src={svgurl} width="32" height="32" class="z-10 m-4 h-8 bg-transparent" />
				<span class="z-10 my-auto mr-4 ml-0 h-7 text-lg font-semibold" safe>
					{name}
				</span>
				{rightArrow}
			</a>
		</div>
	);
}
