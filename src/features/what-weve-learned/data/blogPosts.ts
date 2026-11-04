export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  postNumber?: string | undefined;
  subtitle?: string | undefined;
  excerpt: string;
  body: string;
  tryThis?: string | undefined;
  category: string;
  author?: string | undefined;
  publishedAt?: string | undefined;
  coverImage?: string | undefined;
  readingTime?: string | undefined;
  isPublished: boolean;
}

export interface CardTheme {
  bg: string;
  border: string;
  tagBg: string;
  tagText: string;
  accent: string;
}

export const CARD_THEMES: CardTheme[] = [
  {
    bg: "#fcf8be", // soft pastel yellow
    border: "rgba(0, 2, 1, 0.12)",
    tagBg: "rgba(0, 2, 1, 0.08)",
    tagText: "#000201",
    accent: "#000201",
  },
  {
    bg: "#c8eedb", // soft mint green
    border: "rgba(0, 2, 1, 0.12)",
    tagBg: "rgba(0, 2, 1, 0.08)",
    tagText: "#000201",
    accent: "#000201",
  },
  {
    bg: "#ffd9c5", // warm pastel peach/coral
    border: "rgba(0, 2, 1, 0.12)",
    tagBg: "rgba(0, 2, 1, 0.08)",
    tagText: "#000201",
    accent: "#000201",
  },
  {
    bg: "#d2e7fe", // soft sky blue
    border: "rgba(0, 2, 1, 0.12)",
    tagBg: "rgba(0, 2, 1, 0.08)",
    tagText: "#000201",
    accent: "#000201",
  },
  {
    bg: "#ecd7f8", // pale lavender / lilac
    border: "rgba(0, 2, 1, 0.12)",
    tagBg: "rgba(0, 2, 1, 0.08)",
    tagText: "#000201",
    accent: "#000201",
  },
];

export function getCardTheme(index: number): CardTheme {
  const theme = CARD_THEMES[Math.abs(index) % CARD_THEMES.length];
  return theme ?? CARD_THEMES[0]!;
}
