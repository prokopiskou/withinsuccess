import { MetadataRoute } from 'next'
import { articles } from './insights/articles'

// Parse Greek article dates ("2 Νοεμβρίου 2026") into a real Date so the
// sitemap reports accurate per-article freshness instead of "now" for all.
const GREEK_MONTHS: Record<string, number> = {
  'Ιανουαρίου': 0, 'Φεβρουαρίου': 1, 'Μαρτίου': 2, 'Απριλίου': 3,
  'Μαΐου': 4, 'Ιουνίου': 5, 'Ιουλίου': 6, 'Αυγούστου': 7,
  'Σεπτεμβρίου': 8, 'Οκτωβρίου': 9, 'Νοεμβρίου': 10, 'Δεκεμβρίου': 11,
}

function parseGreekDate(input: string): Date {
  const m = input?.match(/(\d{1,2})\s+([^\s]+)\s+(\d{4})/)
  if (m && m[2] in GREEK_MONTHS) {
    return new Date(Number(m[3]), GREEK_MONTHS[m[2]], Number(m[1]))
  }
  return new Date()
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://withinsuccess.gr',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://withinsuccess.gr/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://withinsuccess.gr/work',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://withinsuccess.gr/insights',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://withinsuccess.gr/anoixti-syzitisi',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://withinsuccess.gr/30days',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://withinsuccess.gr/apply',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://withinsuccess.gr/waitlist',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://withinsuccess.gr/philosophy',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://withinsuccess.gr/corporate',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://withinsuccess.gr/assessment',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://withinsuccess.gr/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...articles.map((article) => ({
      url: `https://withinsuccess.gr/insights/${article.slug}`,
      lastModified: parseGreekDate(article.date as string),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
