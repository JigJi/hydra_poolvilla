// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://poolvillafinder.com'

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
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
    ]

    // Scoop pages
    const scoops = await prisma.scoop.findMany({
        where: { status: 'published' },
        select: { slug: true, updatedAt: true },
    })

    // กรอง scoop เก่า (pool-villas-*) ออกจาก sitemap เพราะ noindex แล้ว
    const goodScoops = scoops.filter((s) => !(s.slug.startsWith('pool-villas-') && !s.slug.includes('2026')))

    const scoopEntries: MetadataRoute.Sitemap = goodScoops.map((scoop) => ({
        url: `${baseUrl}/scoop/${scoop.slug}`,
        lastModified: scoop.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    // Villa pages
    const villas = await prisma.villa.findMany({
        select: { slug: true, updatedAt: true },
    })

    const villaEntries: MetadataRoute.Sitemap = villas.map((villa) => ({
        url: `${baseUrl}/villa/${villa.slug}`,
        lastModified: villa.updatedAt,
        changeFrequency: 'daily',
        priority: 0.9,
    }))

    return [...staticPages, ...scoopEntries, ...villaEntries]
}
