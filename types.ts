export interface RootObject {
	data: Data;
	included: Included[];
}

type Included = IncludedAlbum | IncludedArtist | IncludedArtworks;

interface Data {
	id: string;
	type: string;
	attributes: Attributes;
}

interface Attributes {
	title: string;
	version: null;
	isrc: string;
	duration: string;
	copyright: Copyright;
	explicit: boolean;
	key: string;
	keyScale: string;
	bpm: number;
	popularity: number;
	accessType: string;
	availability: string[];
	mediaTags: string[];
	toneTags: any[];
	externalLinks: ExternalLink[];
	spotlighted: boolean;
	createdAt: string;
}

export interface IncludedAlbum {
	id: string;
	type: "albums";
	attributes: {
		title: string;
		barcodeId: string;
		numberOfVolumes: number;
		numberOfItems: number;
		duration: string;
		explicit: boolean;
		releaseDate: string;
		copyright: Copyright;
		popularity: number;
		accessType: string;
		availability: string[];
		mediaTags: string[];
		externalLinks: ExternalLink[];
		type: string;
		albumType: string;
	};
}

export interface IncludedArtist {
	id: string;
	type: "artists";
	attributes: {
		name: string;
		popularity: number;
		externalLinks: ExternalLink[];
		spotlighted: boolean;
		contributionsEnabled: boolean;
	};
}

export interface IncludedArtworks {
	id: string;
	type: "artworks";
	attributes: {
		mediaType: string;
		files: {
			href: string;
			meta: {
				width: number;
				height: number;
			};
		}[];
		visualMetadata: {
			selectedPaletteColor: string;
			blurHash: string;
			status: string;
		};
	};
}

interface Copyright {
	text: string;
}

interface Links {
	links: {
		self: string;
	};
}

export interface ExternalLink {
	href: string;
	meta: {
		type: string;
	};
}

export interface DspResponse extends Links {
	data: {
		id: string;
		type: string;
		attributes: DSPAttributes;
	}[];
}

type DSPAttributes = Partial<Record<"spotify" | "appleMusic" | "youTubeMusic" | "amazonMusic", { href: string }>>;
