// src/app/page.tsx
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ChevronRight, Star, Sparkles, Home as HomeIcon } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import HeroSlider from '@/components/HeroSlider';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Revalidate data ทุก 1 ชั่วโมง (หรือ 0 ถ้าช่วง Dev)
export const revalidate = 3600;

export const metadata = {
    title: `PoolVillaFinder - จองพูลวิลล่าทั่วไทย ดีลเด็ดปี ${new Date().getFullYear()}`, // ✅ Auto Year
    description: 'ค้นหาและจองพูลวิลล่า พัทยา หัวหิน เขาใหญ่ และทั่วไทย เริ่มต้น 2,990 บาท/คืน',
};

export default async function LandingPage() {
    // 🚀 Parallel Data Fetching: ดึงข้อมูล 3 ส่วนพร้อมกันให้เร็วที่สุด
    const [allScoops, latestVillas] = await Promise.all([
        // 1. ดึง Scoop ทั้งหมด
        prisma.scoop.findMany(),

        // 2. ดึง Villa มาใหม่ 8 หลัง (เพื่อส่งคนเข้าหน้า Detail)
        prisma.villa.findMany({
            take: 8,
            orderBy: { createdAt: 'desc' }, // หรือ updatedAt
            select: {
                id: true,
                title: true,
                slug: true,
                images: true,
                priceDaily: true,
                province: true,
                bedrooms: true,
                maxGuests: true,
                rating: true,
            }
        })
    ]);

    // Logic: สุ่ม Scoop สำหรับ Hero Slider (5 อัน)
    const shuffledScoops = [...allScoops].sort(() => 0.5 - Math.random());
    const randomHeroScoops = shuffledScoops.slice(0, 5).map(s => ({
        id: s.id,
        title: s.title,
        imageUrl: s.coverImage || "",
        slug: s.slug
    }));

    // Logic: แยกหมวดหมู่ Scoop
    const districtScoops = allScoops.filter(s => s.type === 'district');
    const provinceScoops = allScoops.filter(s => s.type === 'province');

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            {/* Navbar อยู่ที่ Layout แล้ว ไม่ต้องใส่ตรงนี้ */}

            <main className="max-w-7xl mx-auto px-4 py-8 space-y-16">

                {/* --- SECTION 1: HERO SLIDER --- */}
                {randomHeroScoops.length > 0 ? (
                    <section className="relative rounded-3xl overflow-hidden shadow-xl shadow-blue-900/10">
                        {/* Badge ตกแต่ง */}
                        <div className="absolute top-4 right-4 z-10 hidden md:block">
                            {/* ✅ แก้ตรงนี้เป็น 2026 หรือใช้ Dynamic Date */}
                            <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-slate-800 shadow-sm flex items-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                อัปเดตล่าสุด {new Date().getFullYear()}
                            </div>
                        </div>
                        <HeroSlider scoops={randomHeroScoops} />
                    </section>
                ) : (
                    <div className="w-full h-[400px] bg-slate-200 rounded-3xl animate-pulse flex items-center justify-center text-slate-400">
                        Loading Highlights...
                    </div>
                )}

                {/* --- SECTION 2: SCOOPS BY DISTRICT (Horizontal Scroll) --- */}
                {districtScoops.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-3">
                                <div className="bg-red-100 p-2.5 rounded-full text-red-600">
                                    <MapPin size={22} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 leading-none">โซนยอดฮิต</h3>
                                    <p className="text-slate-500 text-sm mt-1">รวมที่พักตัวท็อปแยกตามย่านดัง</p>
                                </div>
                            </div>
                            <Link href="/search" className="text-blue-600 font-bold text-sm hover:underline flex items-center gap-1">
                                ดูทั้งหมด <ChevronRight size={16} />
                            </Link>
                        </div>

                        {/* Scroll Container */}
                        <div className="flex gap-4 overflow-x-auto pb-8 pt-2 px-1 -mx-4 md:mx-0 no-scrollbar snap-x">
                            {districtScoops.map((scoop) => (
                                <Link
                                    href={`/scoop/${scoop.slug}`}
                                    key={scoop.id}
                                    className="flex-none w-[260px] md:w-[280px] snap-start group relative hover:-translate-y-1 transition-transform duration-300"
                                >
                                    <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-3 shadow-md group-hover:shadow-lg transition-shadow">
                                        <img
                                            src={scoop.coverImage || "/placeholder.jpg"}
                                            alt={scoop.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                        />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                                        {scoop.title}
                                    </h4>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                        {scoop.description || "คลิกเพื่อดูรายการที่พักแนะนำ"}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- SECTION 3: NEW VILLAS (Grid Layout) - เชื่อมหน้า Detail! --- */}
                {/* นี่คือส่วนที่เพิ่มมาใหม่ เพื่อ Link ไปหน้า Detail ที่เราเพิ่งทำเสร็จ */}
                {latestVillas.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 px-1">
                            <div className="bg-blue-100 p-2.5 rounded-full text-blue-600">
                                <HomeIcon size={22} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 leading-none">วิลล่ามาใหม่</h3>
                                <p className="text-slate-500 text-sm mt-1">จองก่อนใคร บ้านสวย อัปเดตล่าสุด</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {latestVillas.map((villa) => (
                                <Link
                                    href={`/villa/${villa.slug}`} // ✅ Link ไปหน้า Detail
                                    key={villa.id}
                                    className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                                >
                                    {/* Image Area */}
                                    <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                        <img
                                            src={(villa.images as string[])[0] || "/placeholder.jpg"}
                                            alt={villa.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm">
                                            <Star size={12} className="text-orange-400 fill-orange-400" />
                                            {villa.rating || "New"}
                                        </div>
                                        <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur text-white text-[10px] px-2 py-0.5 rounded">
                                            {villa.province}
                                        </div>
                                    </div>

                                    {/* Content Area */}
                                    <div className="p-4">
                                        <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-1">
                                            {villa.title}
                                        </h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                            <span>🛏 {villa.bedrooms} นอน</span>
                                            <span>👥 {villa.maxGuests} ท่าน</span>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-3 border-t border-slate-100">
                                            <div className="text-xs text-slate-400">ราคาเริ่มต้น</div>
                                            <div className="text-lg font-black text-blue-600">
                                                ฿{villa.priceDaily.toLocaleString()}
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

                {/* --- SECTION 4: PROVINCE SCOOPS (Visual Grid) --- */}
                {provinceScoops.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h3 className="text-2xl font-black text-slate-900">📍 เลือกตามจังหวัด</h3>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {provinceScoops.slice(0, 4).map((scoop) => (
                                <Link
                                    href={`/scoop/${scoop.slug}`}
                                    key={scoop.id}
                                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer"
                                >
                                    <img
                                        src={scoop.coverImage || ""}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
                                        alt={scoop.title}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h4 className="text-white font-bold text-xl leading-tight shadow-black drop-shadow-md">
                                            {scoop.title.replace('รวมพูลวิลล่า', '').trim()}
                                            {/* ตัดคำว่า รวมพูลวิลล่า ออกเพื่อความสั้นกระชับ */}
                                        </h4>
                                        <div className="w-8 h-1 bg-yellow-400 mt-2 rounded-full group-hover:w-16 transition-all duration-300"></div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
}