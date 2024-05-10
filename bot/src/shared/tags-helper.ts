export type TagInformation = {
	id: string;
	name: string;
	icon: string;
}

export default class TagsHelper {
	private tags: Map<string, Readonly<TagInformation>>;
	private unknownTagsMap: Map<string, Readonly<TagInformation>>;

	public constructor(tags?: ReadonlyArray<Readonly<TagInformation>>) {
		this.tags = new Map((tags ?? TagsHelper.normalTags).map(tag => [tag.id, tag]));
		this.unknownTagsMap = new Map();
	}

	public getTags(ids: ReadonlyArray<string>): Readonly<TagInformation>[] {
		return ids.map(id => this.getTag(id));
	}

	public getTag(id: string) {
		return this.tags.get(id) ?? this.getUnknownTag(id);
	}

	public getAllTags() {
		return Array.from(this.tags.values()).sort((a,b) => a.name.localeCompare(b.name));
	}

	private getUnknownTag(id: string) {
		const existingTag = this.unknownTagsMap.get(id);
		if (existingTag) {
			return existingTag;
		}

		const unknownTag: TagInformation = {
			id: id,
			name: "Unknown",
			icon: "❓",
		}

		this.unknownTagsMap.set(id, unknownTag);
		return unknownTag;
	}

	public static normalTags: ReadonlyArray<Readonly<TagInformation>> = [
		{
			id: "ctm",
			name: "Complete the Monument",
			icon: "⬜",
		},
		{
			id: "hns",
			name: "Hide and Seek",
			icon: "🔎",
		},
		{
			id: "multiple",
			name: "Multiple",
			icon: "🎊",
		},
		{
			id: "other",
			name: "Uncategorized",
			icon: "❓",
		},
		{
			id: "parkour",
			name: "Parkour",
			icon: "🏃",
		},
		{
			id: "puzzle",
			name: "Puzzle",
			icon: "🧩",
		},
		{
			id: "pve",
			name: "PVE",
			icon: "🧟",
		},
		{
			id: "pvp",
			name: "PVP",
			icon: "⚔️",
		},
		{
			id: "stategy",
			name: "Stategy",
			icon: "🧠",
		},
		{
			id: "adventure",
			name: "Adventure",
			icon: "🛡️",
		},
		{
			id: "creation",
			name: "Creation",
			icon: "🏛️",
		},
		{
			id: "horror",
			name: "Horror",
			icon: "👻",
		},
		{
			id: "race",
			name: "Race",
			icon: "🏎️",
		},
		{
			id: "sandbox",
			name: "Sandbox",
			icon: "🟨",
		},
		{
			id: "survival",
			name: "Survival",
			icon: "🍎",
		},
		{
			id: "tabletop",
			name: "Tabletop Game",
			icon: "♟️",
		},
		{
			id: "minigame",
			name: "Minigame",
			icon: "🏓",
		},
		{
			id: "social-deduction",
			name: "Social Deduction",
			icon: "🧐",
		},
		{
			id: "datapack",
			name: "Datapack",
			icon: "📦",
		}
	]
}