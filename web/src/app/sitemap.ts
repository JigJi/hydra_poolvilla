// src/app/sitemap.ts
import { MetadataRoute } from 'next'
import { prisma } from '@/lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://poolvillafinder.com' // TODO: ตอนเอาขึ้นจริงอย่าลืมเปลี่ยนเป็นโดเมนของคุณนะครับ

    // 1. ดึงหน้า Scoop ทั้งหมด (เอาเฉพาะที่ published แล้ว)
    const scoops = await prisma.scoop.findMany({
        where: { status: 'published' },
        select: {
            slug: true,
            updatedAt: true,
        },
    })

    // 2. 🚀 ดึงหน้า Villa ทั้งหมด (นี่แหละไม้ตายของเรา!)
    const villas = await prisma.villa.findMany({
        select: {
            slug: true,
            updatedAt: true,
        },
    })

    // 3. แปลง Scoop เป็นรูปแบบ Sitemap
    const scoopEntries: MetadataRoute.Sitemap = scoops.map((scoop) => ({
        url: `${baseUrl}/scoop/${scoop.slug}`,
        lastModified: scoop.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.8,
    }))

    // 4. แปลง Villa เป็นรูปแบบ Sitemap
    const villaEntries: MetadataRoute.Sitemap = villas.map((villa) => ({
        url: `${baseUrl}/villa/${villa.slug}`,
        lastModified: villa.updatedAt,
        changeFrequency: 'daily', // วิลล่าอาจจะอัปเดตราคาหรือสถานะบ่อย
        priority: 0.9, // ให้ความสำคัญรองลงมาจากหน้า Home
    }))

    // 5. รวมหน้า Home + Scoop + Villa เข้าด้วยกัน
    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0, // หน้า Home สำคัญที่สุด
        },
        // ใส่หน้า Search เข้าไปด้วยเผื่อบอทอยากดู (Optional)
        {
            url: `${baseUrl}/search`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        ...scoopEntries,
        ...villaEntries, // ยัดหมื่นหน้าลงไปตรงนี้!
    ]
}