// src/components/scoop/RelatedScoops.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import { BookOpen, MapPin } from 'lucide-react';

export default async function RelatedScoops({
    currentProvince,
    currentDistrict,
    currentScoopId // 🚀 เพิ่ม 1: รับ ID ของบทความปัจจุบันเข้ามา
}: {
    currentProvince: string;
    currentDistrict: string;
    currentScoopId?: number; // 🚀 เพิ่ม 2: กำหนด Type เป็น optional เผื่อหน้า Villa ไม่ได้ส่งมา
}) {
    // 1. THE BRIDGE: หาชื่ออำเภอทั้งหมดในจังหวัดนี้จากตาราง Villa เพื่อเอาไปกวาดหาใน Scoop
    const distinctDistricts = await prisma.villa.findMany({
        where: { province: currentProvince },
        select: { district: true },
        distinct: ['district']
    });

    // 2. KEYWORD BUILDER: รวบรวมคำศัพท์ที่จะใช้ค้นหา
    const keywordsToSearch: string[] = [];
    if (currentProvince && !keywordsToSearch.includes(currentProvince)) keywordsToSearch.push(currentProvince);
    if (currentDistrict && !keywordsToSearch.includes(currentDistrict)) keywordsToSearch.push(currentDistrict);

    distinctDistricts.forEach(v => {
        if (v.district && !keywordsToSearch.includes(v.district)) {
            keywordsToSearch.push(v.district);
        }
    });

    // 3. BUILD SEARCH CONDITIONS
    const searchConditions: any[] = [];
    keywordsToSearch.forEach(kw => {
        // หาจาก Slug (เช่น "hang-dong")
        const slugFormat = kw.toLowerCase().replace(/\s+/g, '-');
        searchConditions.push({ slug: { contains: slugFormat, mode: 'insensitive' } });
        // หาจาก Title (เช่น "หางดง")
        searchConditions.push({ title: { contains: kw, mode: 'insensitive' } });
    });

    // 4. FETCH RAW SCOOPS: ดึงมาเผื่อไว้ก่อน (เช่น ดึงมา 50 อัน) เพื่อเอามาสุ่ม
    const rawScoops = await prisma.scoop.findMany({
        where: {
            status: 'published',
            OR: searchConditions.length > 0 ? searchConditions : undefined,
            id: currentScoopId ? { not: currentScoopId } : undefined // 🚀 เพิ่ม 3: ดักไม่ให้ดึง ID ของหน้าปัจจุบันมาแสดงซ้ำ
        },
        take: 50, // ดึงมาเป็น Pool ใหญ่ๆ ก่อน
        select: { id: true, slug: true, title: true, coverImage: true },
    });

    // 5. 🎲 RANDOM LOGIC: สับไพ่ (Shuffle) แล้วหยิบมา 9 อันให้พอดีกับ 3 คอลัมน์
    const localScoops = rawScoops
        .sort(() => 0.5 - Math.random()) // สลับตำแหน่ง Array แบบสุ่ม
        .slice(0, 9); // ตัดมาแค่ 9 อัน

    // 6. ถ้าในจังหวัดนี้ยังไม่มี Scoop เลย ก็ไม่แสดง Section นี้
    if (localScoops.length === 0) return null;

    // 7. RENDER UI
    return (
        <div className="mt-16 mb-8 border-t border-slate-100 pt-12">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-6">
                <BookOpen size={28} className="text-blue-600" />
                บทความแนะนำและที่เที่ยว {currentProvince}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localScoops.map((scoop) => (
                    <Link
                        key={scoop.id}
                        href={`/scoop/${scoop.slug}`}
                        className="group flex gap-3 p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-[0_8px_15px_-3px_rgba(59,130,246,0.1)] transition-all duration-300 bg-white"
                    >
                        <div className="w-20 h-20 rounded-xl bg-slate-100 shrink-0 overflow-hidden relative">
                            <img
                                src={scoop.coverImage || 'https://via.placeholder.com/150'}
                                alt={scoop.title}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                loading="lazy"
                            />
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {scoop.title}
                            </h4>
                            <span className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                                <MapPin size={12} className="text-red-400 shrink-0" />
                                <span className="truncate">
                                    {currentProvince}
                                </span>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}