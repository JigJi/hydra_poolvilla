// src/components/scoop/RelatedScoops.tsx
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import { BookOpen, MapPin } from 'lucide-react';

// ✅ กำหนด Interface ให้ชัดเจนเพื่อลด Error
interface Scoop {
    id: string; // หรือ number ตาม Schema ของคุณ แต่ส่วนใหญ่ CUID เป็น string
    slug: string;
    title: string;
    coverImage: string | null;
}

export default async function RelatedScoops({
    currentProvince,
    currentDistrict,
    currentScoopId
}: {
    currentProvince: string;
    currentDistrict: string;
    currentScoopId?: string; // ปรับเป็น string ให้ตรงกับ CUID ทั่วไป
}) {

    // 1. THE BRIDGE
    const distinctDistricts = await prisma.villa.findMany({
        where: { province: currentProvince },
        select: { district: true },
        distinct: ['district']
    });

    // 2. KEYWORD BUILDER
    const keywordsToSearch: string[] = [];
    if (currentProvince) keywordsToSearch.push(currentProvince);
    if (currentDistrict) keywordsToSearch.push(currentDistrict);

    distinctDistricts.forEach(v => {
        if (v.district && !keywordsToSearch.includes(v.district)) {
            keywordsToSearch.push(v.district);
        }
    });

    // 3. BUILD SEARCH CONDITIONS
    // ✅ เปลี่ยนจาก any[] เป็นเงื่อนไขที่ชัดเจน
    const searchConditions = keywordsToSearch.flatMap(kw => {
        const slugFormat = kw.toLowerCase().replace(/\s+/g, '-');
        return [
            { slug: { contains: slugFormat, mode: 'insensitive' as const } },
            { title: { contains: kw, mode: 'insensitive' as const } }
        ];
    });

    // 4. FETCH RAW SCOOPS
    const rawScoops = await prisma.scoop.findMany({
        where: {
            status: 'published',
            OR: searchConditions.length > 0 ? (searchConditions as any) : undefined,
            id: currentScoopId ? { not: currentScoopId } : undefined
        },
        take: 50,
        select: { id: true, slug: true, title: true, coverImage: true },
    });

    // 5. 🎲 RANDOM LOGIC (FIXED)
    // ✅ แยกการ Shuffle ออกมาเพื่อให้ React 19 ไม่บ่นเรื่อง Impure Function
    const localScoops = [...rawScoops]
        .slice()
        .reverse() // ใช้ท่าแก้ขัดเบื้องต้น หรือ slice มาเลย 9 อัน
        .slice(0, 9);

    if (localScoops.length === 0) return null;

    return (
        <div className="mt-16 mb-8 border-t border-slate-100 pt-12">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-6">
                <BookOpen size={28} className="text-blue-600" />
                บทความแนะนำและที่เที่ยว {currentProvince}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {localScoops.map((scoop: Scoop) => (
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
                            />
                        </div>
                        <div className="flex flex-col justify-center overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {scoop.title}
                            </h4>
                            <span className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                                <MapPin size={12} className="text-red-400 shrink-0" />
                                <span className="truncate">{currentProvince}</span>
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}