import autoprefixer from "autoprefixer";
// import tailwind from "tailwindcss";
import cssnano from "cssnano";
// import { purgeCSSPlugin } from "@fullhuman/postcss-purgecss";

// import config from "./tailwind.config.mjs";

/** @type {import('postcss-load-config').Config} */
export default {
	plugins: [
		// what in the fuck is this
		// cannot use tailwind v4 since it produces way larger output??? why would it do that????
		// in tailwind play I got 6.1kb on v3 and 6.45kb on v4
		// the difference is even worse here
		// tailwind({ config }),
		autoprefixer(),
		// purgeCSSPlugin({
		// 	content: ["./base.html", "web/*.tsx"], // breaks shit
		// }),
		cssnano({ preset: "default" }),
		// cssnano({ preset: "@docusaurus/cssnano-preset" })
	],
};