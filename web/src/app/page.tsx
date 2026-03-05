// src/app/page.tsx
import React from 'react';
import Link from 'next/link';
import { MapPin, ChevronRight, Star, Sparkles, Home as HomeIcon, BookOpen } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import HeroSlider from '@/components/HeroSlider';
import { Button } from "@/components/ui/button";

// Revalidate data ทุก 1 ชั่วโมง
export const revalidate = 3600;

export const metadata = {
    title: `PoolVillaFinder - จองพูลวิลล่าทั่วไทย ดีลเด็ดปี ${new Date().getFullYear()}`,
    description: 'ค้นหาและจองพูลวิลล่า พัทยา หัวหิน เขาใหญ่ และทั่วไทย เริ่มต้น 2,990 บาท/คืน',
};

// 📍 Hardcode ปลายทางยอดฮิต (ดีต่อ UX และ SEO Internal Link)
const TOP_DESTINATIONS = [
    { name: 'พัทยา', slug: 'top-pool-villas-pattaya-2026', icon: '🏖️' },
    { name: 'หัวหิน', slug: 'top-pool-villas-hua-hin-2026', icon: '🌊' },
    { name: 'เชียงใหม่', slug: 'top-pool-villas-mueang-chiang-mai-2026', icon: '⛰️' },
    { name: 'ภูเก็ต', slug: 'top-pool-villas-mueang-phuket-2026', icon: '🏝️' },
    { name: 'เขาใหญ่', slug: 'top-pool-villas-pak-chong-2026', icon: '🏕️' },
    { name: 'ชะอำ', slug: 'top-pool-villas-cha-am-2026', icon: '🏄‍♂️' },
];

export default async function LandingPage() {
    // 🚀 Parallel Data Fetching: ดึงมาแค่ที่ใช้จริง ลดภาระ Database
    const [latestScoops, latestVillas] = await Promise.all([
        // 1. ดึง Scoop ล่าสุด 11 อัน (5 อันไปทำ Hero Slider, 6 อันลง Grid ด้านล่าง)
        // กรอง scoop เก่า (pool-villas-*) ออก เพราะ noindex แล้ว
        prisma.scoop.findMany({
            where: {
                status: 'published',
                NOT: {
                    slug: { startsWith: 'pool-villas-' },
                },
            },
            orderBy: { updatedAt: 'desc' },
            take: 11,
            select: { id: true, title: true, slug: true, coverImage: true }
        }),

        // 2. ดึง Villa มาใหม่ 8 หลัง
        prisma.villa.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, title: true, slug: true, images: true, priceDaily: true, province: true, bedrooms: true, maxGuests: true, rating: true,
            }
        })
    ]);

    // แบ่ง Scoop เป็น 2 กลุ่ม
    const heroScoops = latestScoops.slice(0, 5).map(s => ({
        id: s.id, title: s.title, imageUrl: s.coverImage || "", slug: s.slug
    }));
    const gridScoops = latestScoops.slice(5, 11);

    const websiteJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'PoolVillaFinder',
        url: 'https://poolvillafinder.com',
        potentialAction: {
            '@type': 'SearchAction',
            target: 'https://poolvillafinder.com/search?q={search_term_string}',
            'query-input': 'required name=search_term_string',
        },
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
            <main className="max-w-7xl mx-auto px-4 py-8 space-y-16">

                <h1 className="sr-only">PoolVillaFinder - ค้นหาและจองพูลวิลล่าทั่วไทย</h1>

                {/* --- SECTION 1: HERO SLIDER --- */}
                {heroScoops.length > 0 && (
                    <section className="relative rounded-3xl overflow-hidden shadow-xl shadow-blue-900/10">
                        <div className="absolute top-4 right-4 z-10 hidden md:block">
                            <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                อัปเดตล่าสุด {new Date().getFullYear()}
                            </div>
                        </div>
                        <HeroSlider scoops={heroScoops} />
                    </section>
                )}

                {/* --- SECTION 2: TOP DESTINATIONS (Quick Links) --- */}
                <section>
                    <div className="flex items-center gap-3 px-1 mb-6">
                        <div className="bg-red-100 p-2.5 rounded-full text-red-600">
                            <MapPin size={22} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 leading-none">จุดหมายยอดฮิต</h3>
                            <p className="text-slate-500 text-sm mt-1">ค้นหาพูลวิลล่าในเมืองท่องเที่ยวยอดนิยม</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {TOP_DESTINATIONS.map((dest) => (
                            <Link
                                href={`/scoop/${dest.slug}`}
                                key={dest.slug}
                                className="bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md rounded-2xl p-4 flex flex-col items-center justify-center gap-2 transition-all group"
                            >
                                <span className="text-3xl group-hover:scale-110 transition-transform">{dest.icon}</span>
                                <span className="font-bold text-slate-700 group-hover:text-blue-600">{dest.name}</span>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* --- SECTION 3: NEW VILLAS --- */}
                {latestVillas.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                                    <HomeIcon size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-none">วิลล่ามาใหม่</h3>
                                    <p className="text-slate-500 text-sm mt-1">จองก่อนใคร บ้านสวย อัปเดตล่าสุด</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {latestVillas.map((villa) => (
                                <Link
                                    href={`/villa/${villa.slug}`}
                                    key={villa.id}
                                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block flex flex-col h-full"
                                >
                                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 shrink-0">
                                        <img
                                            src={(villa.images as string[])[0] || "/placeholder.jpg"}
                                            alt={villa.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                            <Star size={12} className="text-orange-400 fill-orange-400" />
                                            {villa.rating || "New"}
                                        </div>
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h4 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                                            {villa.title}
                                        </h4>
                                        <div className="mt-auto">
                                            <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                                                <div className="text-xs text-slate-400">ราคาเริ่มต้น</div>
                                                <div className="text-lg font-black text-blue-600">
                                                    ฿{villa.priceDaily.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <div className="flex justify-center mt-8">
                            <Link href="/search">
                                <Button variant="outline" className="rounded-full px-8 border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-600">
                                    ดูวิลล่าทั้งหมด
                                </Button>
                            </Link>
                        </div>
                    </section>
                )}

                {/* --- SECTION 4: LATEST SCOOPS (The pSEO Link Generator) --- */}
                {gridScoops.length > 0 && (
                    <section className="space-y-6 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className="bg-emerald-100 p-2.5 rounded-full text-emerald-600">
                                    <BookOpen size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-none">บทความแนะนำล่าสุด</h3>
                                    <p className="text-slate-500 text-sm mt-1">รีวิวพูลวิลล่าและคู่มือท่องเที่ยวทั่วไทย</p>
                                </div>
                            </div>
                            <Link href="/scoop" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                                ดูบทความทั้งหมด <ChevronRight size={16} />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {gridScoops.map((scoop) => (
                                <Link
                                    key={scoop.id}
                                    href={`/scoop/${scoop.slug}`}
                                    className="group flex gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-[0_8px_15px_-3px_rgba(59,130,246,0.1)] transition-all duration-300 bg-white"
                                >
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative">
                                        <img
                                            src={scoop.coverImage || '/placeholder.jpg'}
                                            alt={scoop.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                            loading="lazy"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center overflow-hidden">
                                        <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                            {scoop.title}
                                        </h4>
                                        <span className="text-xs font-medium text-slate-500 mt-2 flex items-center gap-1">
                                            <Sparkles size={12} className="text-emerald-500" />
                                            อัปเดตใหม่
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}