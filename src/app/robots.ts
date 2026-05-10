import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/30days/thank-you'],
      },
    ],
    sitemap: 'https://withinsuccess.gr/sitemap.xml',
    host: 'https://withinsuccess.gr',
  }
}
