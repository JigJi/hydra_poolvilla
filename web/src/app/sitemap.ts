// src/app/sitemap.ts
// Next.js generates a sitemap index automatically when generateSitemaps() is exported
// Result: /sitemap.xml (index) -> /sitemap/0.xml (static+scoops), /sitemap/1.xml (villas)
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

// Tell Next.js to create multiple sitemaps
export async function generateSitemaps() {
    return [{ id: 0 }, { id: 1 }]
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://poolvillafinder.com'

    // Sitemap 0: Static pages + Scoops
    if (id === 0) {
        const scoops = await prisma.scoop.findMany({
            where: {
                status: 'published',
                NOT: { slug: { startsWith: 'pool-villas-' } },
            },
            select: { slug: true, updatedAt: true },
        })

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
        ]
    }

    // Sitemap 1: Villas
    const villas = await prisma.villa.findMany({
        select: { slug: true, updatedAt: true },
    })

    return villas.map((villa) => ({
        url: `${baseUrl}/villa/${villa.slug}`,
        lastModified: villa.updatedAt,
        changeFrequency: 'daily' as const,
        priority: 0.9,
    }))
}
