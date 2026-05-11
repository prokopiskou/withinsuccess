export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  keywords: string[];
  metaDescription?: string;
  content: string;
} & Record<string, unknown>;

export const articles: Article[] = [];
