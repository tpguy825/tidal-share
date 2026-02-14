export interface RootObject {
	data: Data;
	links: Links;
	included: Included[];
}

type Included =
	| IncludedAlbum
	| IncludedArtist
	| IncludedArtworks
	| {
			id: string;
			type: string;
			attributes: Attributes2;
	  };

interface Attributes2 {
	title?: string;
	barcodeId?: string;
	numberOfVolumes?: number;
	numberOfItems?: number;
	duration?: string;
	explicit?: boolean;
	releaseDate?: string;
	copyright?: Copyright;
	popularity?: number;
	accessType?: string;
	availability?: string[];
	mediaTags?: string[];
	externalLinks?: ExternalLink[];
	type?: string;
	albumType?: string;
	name?: string;
	spotlighted?: boolean;
	contributionsEnabled?: boolean;
	mediaType?: string;
	files?: File[];
	visualMetadata?: VisualMetadata;
}

interface VisualMetadata {
	selectedPaletteColor: string;
	blurHash: string;
	status: string;
}

interface File {
	href: string;
	meta: Meta2;
}

interface Meta2 {
	width: number;
	height: number;
}

interface Data {
	id: string;
	type: string;
	attributes: Attributes;
	relationships: Relationships;
}

interface Relationships {
	usageRules: UsageRules;
	albums: Albums;
	trackStatistics: UsageRules;
	similarTracks: UsageRules;
	priceConfig: UsageRules;
	owners: UsageRules;
	sourceFile: UsageRules;
	radio: UsageRules;
	shares: UsageRules;
	credits: UsageRules;
	artists: Albums;
	genres: UsageRules;
	lyrics: UsageRules;
	replacement: UsageRules;
	metadataStatus: UsageRules;
	providers: UsageRules;
}

interface Albums {
	data: Datum[];
	links: Links;
}

interface Datum {
	id: string;
	type: string;
}

interface UsageRules {
	links: Links;
}

interface Links {
	self: string;
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

interface Copyright {
	text: string;
}

interface Datum {
	id: string;
	type: string;
}

interface Links {
	self: string;
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

export interface ExternalLink {
	href: string;
	meta: Meta;
}

interface Meta {
	type: string;
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
		visualMetadata: VisualMetadata;
	};
}

interface VisualMetadata {
	selectedPaletteColor: string;
	blurHash: string;
	status: string;
}


export interface DspResponse {
  data: Datum[];
  links: Links;
}

interface Datum {
  id: string;
  type: string;
  attributes: DSPAttributes;
  relationships: Relationships;
}

interface Relationships {
  subject: Subject;
}

interface Subject {
  links: Links;
}

interface Links {
  self: string;
}

type DSPAttributes = Partial<Record<"spotify" | "appleMusic" | "youTubeMusic" | "amazonMusic", { href: string }>>;
