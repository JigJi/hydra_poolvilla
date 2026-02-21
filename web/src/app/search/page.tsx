// src/app/search/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { MapPin, Star, Search as SearchIcon } from 'lucide-react';
import { Button } from "@/components/ui/button";

// บอก Next.js ว่าหน้านี้เป็น Dynamic เพราะต้องรับค่า Search Params ตลอดเวลา
export const dynamic = 'force-dynamic';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    // 1. รับค่าที่ส่งมาจาก URL (เช่น ?province=pattaya)
    const rawQuery = searchParams.province as string || searchParams.q as string || '';

    // คลีนคำค้นหา (เปลี่ยนขีดเป็นช่องว่าง เช่น chiang-mai -> chiang mai)
    const cleanQuery = rawQuery.replace(/-/g, ' ');

    // 2. สร้างเงื่อนไขการค้นหา
    let whereClause = {};
    if (cleanQuery) {
        whereClause = {
            OR: [
                { province: { contains: cleanQuery, mode: 'insensitive' } },
                { district: { contains: cleanQuery, mode: 'insensitive' } },
                { title: { contains: cleanQuery, mode: 'insensitive' } },
            ]
        };
    }

    // 3. ดึงข้อมูลจาก Database
    const villas = await prisma.villa.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 40, // ดึงมาสูงสุด 40 หลังก่อน (เดี๋ยวอนาคตค่อยทำ Pagination)
        select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            priceDaily: true,
            province: true,
            district: true,
            bedrooms: true,
            maxGuests: true,
            rating: true,
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20 pt-8">
            <main className="max-w-7xl mx-auto px-4">

                {/* --- HEADER SECTION --- */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
                        <SearchIcon className="text-blue-600" size={32} />
                        ผลการค้นหา
                    </h1>
                    {cleanQuery ? (
                        <p className="text-slate-500 text-lg">
                            พบวิลล่า <span className="font-bold text-blue-600">{villas.length}</span> แห่ง สำหรับ "{cleanQuery}"
                        </p>
                    ) : (
                        <p className="text-slate-500 text-lg">วิลล่าทั้งหมดของเรา</p>
                    )}
                </div>

                {/* --- RESULTS GRID --- */}
                {villas.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {villas.map((villa) => (
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
                                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur text-white text-[10px] px-2 py-1 rounded flex items-center gap-1">
                                        <MapPin size={10} /> {villa.district}, {villa.province}
                                    </div>
                                </div>
                                <div className="p-4 flex flex-col flex-grow">
                                    <h4 className="font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
                                        {villa.title}
                                    </h4>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                                        <span>🛏 {villa.bedrooms} นอน</span>
                                        <span>👥 {villa.maxGuests} ท่าน</span>
                                    </div>
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
                ) : (
                    /* --- EMPTY STATE --- */
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center flex flex-col items-center justify-center">
                        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <SearchIcon size={40} className="text-slate-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2">ไม่พบวิลล่าที่คุณค้นหา</h3>
                        <p className="text-slate-500 mb-6 max-w-md">
                            ลองเปลี่ยนคำค้นหาให้กว้างขึ้น หรือดูวิลล่ายอดนิยมของเราแทนไหมครับ?
                        </p>
                        <Link href="/">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8">
                                กลับไปหน้าแรก
                            </Button>
                        </Link>
                    </div>
                )}

            </main>
        </div>
    );
}