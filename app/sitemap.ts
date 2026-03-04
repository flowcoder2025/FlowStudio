import { MetadataRoute } from 'next'

const BASE_URL = 'https://studio.flow-coder.com'

const routes = [
  { path: '', changeFrequency: 'daily' as const, priority: 1 },
  { path: '/workflow', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/gallery', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/edit', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/poster', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/detail-page', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/detail-edit', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/color-correction', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/composite', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/pricing', changeFrequency: 'monthly' as const, priority: 0.7 },
  { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
  { path: '/refund', changeFrequency: 'yearly' as const, priority: 0.3 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: {
      languages: {
        ko: `${BASE_URL}${route.path}`,
        en: `${BASE_URL}/en${route.path}`,
      },
    },
  }))
}
