import Elysia, { file } from "elysia";
import { get, getToken } from "./tidal-share";
import { base } from "./_utils";
import type { IncludedAlbum, IncludedArtist, IncludedArtworks } from "./types";

// await Bun.$`bash css.sh`;

const app = new Elysia().get("/", "Add a TIDAL song ID to the url to use this service.");

for (const f of ["styles.css", "tidal.svg", "amazon.svg", "spotify.svg", "apple.svg", "yt.svg"])
	app.get("/assets/" + f, file("./assets/" + f));

app.get("/*", async ({ path, status }) => {
	console.log(path, path.substring(1).split("/").map(Number));

	const ids = path.substring(1).split("/").map(Number).filter(Number.isSafeInteger);
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

			const cover = artworks.attributes.files.sort(
				(b, a) => a.meta.height * a.meta.width - b.meta.height * b.meta.width,
			)[0]?.href;

			const streams: Record<string, string> = {};

			for (const d of dsp.data) {
				for (const [p, l] of Object.entries(d.attributes)) {
					streams[p] = l.href;
				}
			}

			return base(
				<body class="flex h-screen w-full py-4 md:py-0 flex-col">
					<div class="flex m-auto flex-col md:flex-row max-w-96 md:max-w-none gap-8 md:columns-2">
						<div class="flex flex-col rounded-lg border md:min-w-96 md:w-96 w-80 min-w-80 md:h-[446px]">
							<a href={cover}>
								<img
									src={cover}
									alt="Album cover"
									height="288"
									width="288"
									style={
										"box-shadow: 0px 0px 100px 24px " +
										artworks.attributes.visualMetadata.selectedPaletteColor
									}
									class="rounded-lg md:mx-12 md:mt-12 m-4"
								/>
							</a>
							<h1 class="z-10 mx-auto mb-1 max-w-64 text-center text-2xl font-bold wrap-normal" safe>
								{attrs.title}
							</h1>
							<h2 class="z-10 mx-auto text-lg mb-4" safe>
								{artists.map((t) => t.attributes.name).join(", ")}
							</h2>
						</div>
						<div class="overflow-clip rounded-lg border w-full mb-4 md:h-[446px]">
							<h3 class="m-4 text-xl font-bold">Stream:</h3>
							<div class="flex flex-col gap-3 mb-4">
								<BaseStreamingService
									url={"https://tidal.com/track/" + ids[0]}
									name="Tidal"
									svgurl="/assets/tidal.svg"
									shadowcolour="240,240,240"
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
			);
		} catch (e) {
			console.error(e);
			return status(400, "Invalid ID");
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
				class="stream-link relative z-10 flex h-16 rounded-xl border select-none hover:cursor-pointer"
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
