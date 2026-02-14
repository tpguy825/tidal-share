import fs from "fs";

const basehtml = fs.readFileSync("./t.html", "utf-8");

export async function base(
	text: string | Promise<string>,
	headtext?: string | Promise<string>,
	status = 200,
	title = "Document",
	headers: Record<string, string | undefined> = {},
) {
	let replaced = basehtml
		.replace("{{ content }}", await text)
		.replace("{{ headcontent }}", headtext ? await headtext : ((<title safe>{title}</title>) as string));
	return new Response(replaced, {
		status,
		headers: {
			...headers,
			"Content-Type": "text/html",
		},
	});
}
