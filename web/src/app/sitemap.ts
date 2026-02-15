import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma' // หรือทางที่เชื่อม Database ของคุณ

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://poolvillafinder.com' // เปลี่ยนเป็น URL จริงของคุณ

    // 1. ดึง Slugs ทั้งหมดจากตาราง Scoop
    const scoops = await prisma.scoop.findMany({
        select: {
            slug: true,
            updatedAt: true,
        },
    })

    // 2. แปลงข้อมูลเป็นรูปแบบ Sitemap
    const scoopEntries: MetadataRoute.Sitemap = scoops.map((scoop) => ({
        url: `${baseUrl}/scoop/${scoop.slug}`,
        lastModified: scoop.updatedAt,
        changeFrequency: 'weekly', // หน้า Scoop ไม่ได้เปลี่ยนทุกวัน ใช้ weekly ก็พอ
        priority: 0.8,
    }))

    // 3. รวมหน้าหลักอื่นๆ (Home, Static Pages)
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        ...scoopEntries,
    ]
}