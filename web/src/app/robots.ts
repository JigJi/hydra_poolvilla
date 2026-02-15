import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*', // อนุญาตให้ Bot ทุกตัว (Google, Bing, ฯลฯ) เข้ามาเก็บข้อมูลได้
            allow: '/',     // อนุญาตให้เก็บข้อมูลได้ทุกหน้าในเว็บ
        },
        // ชี้เป้าไปที่ไฟล์ Sitemap ที่เราสร้างไว้ (ใช้ URL จริงของคุณ)
        sitemap: 'https://poolvillafinder.com/sitemap.xml',
    }
}