// src/app/sitemap.ts
// Single sitemap at /sitemap.xml (no index needed for ~550 URLs)
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://poolvillafinder.com'

    const [scoops, villas] = await Promise.all([
        prisma.scoop.findMany({
            where: {
                status: 'published',
                NOT: { slug: { startsWith: 'pool-villas-' } },
            },
            select: { slug: true, updatedAt: true },
        }),
        prisma.villa.findMany({
            select: { slug: true, updatedAt: true },
        }),
    ])

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        {
            url: `${baseUrl}/scoop`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        },
        ...scoops.map((scoop) => ({
            url: `${baseUrl}/scoop/${scoop.slug}`,
            lastModified: scoop.updatedAt,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        })),
        ...villas.map((villa) => ({
            url: `${baseUrl}/villa/${villa.slug}`,
            lastModified: villa.updatedAt,
            changeFrequency: 'daily' as const,
            priority: 0.9,
        })),
    ]
}
