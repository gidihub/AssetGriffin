import type { MetadataRoute } from 'next'
import { solutions } from '@/lib/solutions-data'
import { industries } from '@/lib/industries-data'
import { subVerticals } from '@/lib/sub-verticals-data'
import { compareTargets } from '@/lib/compare-data'
import { blogPosts } from '@/lib/blog-data'
import { tutorials } from '@/lib/tutorials-data'

const baseUrl = 'https://www.assetgriffin.com'

const staticRoutes = [
  '',
  '/about',
  '/contact',
  '/faq',
  '/privacy-policy',
  '/terms-of-use',
  '/gdpr-policy',
  '/solutions',
  '/industries',
  '/compare',
  '/blog',
  '/resources/asset-depreciation-calculator',
  '/resources/asset-tag-generator',
  '/resources/asset-management-guide',
  '/resources/roi-calculator',
  '/resources/tutorials',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries = staticRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.6,
  }))

  const solutionEntries = solutions.map((solution) => ({
    url: `${baseUrl}/solutions/${solution.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const industryEntries = industries.map((industry) => ({
    url: `${baseUrl}/industries/${industry.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const subVerticalEntries = subVerticals.map((entry) => ({
    url: `${baseUrl}/industries/${entry.group}/${entry.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  const compareEntries = compareTargets.map((target) => ({
    url: `${baseUrl}/compare/${target.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: target.isPlaceholder ? 0.3 : 0.7,
  }))

  const blogEntries = blogPosts.map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  const tutorialEntries = tutorials.map((tutorial) => ({
    url: `${baseUrl}/resources/tutorials/${tutorial.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  return [
    ...staticEntries,
    ...solutionEntries,
    ...industryEntries,
    ...subVerticalEntries,
    ...compareEntries,
    ...blogEntries,
    ...tutorialEntries,
  ]
}
