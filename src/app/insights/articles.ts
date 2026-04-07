export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: number;
  keywords: string[];
  content: string;
};

export const articles: Article[] = [];