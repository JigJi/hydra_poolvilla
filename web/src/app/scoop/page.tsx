// src/app/scoop/page.tsx
import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { BookOpen, Calendar, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export const metadata = {
    title: 'บทความและที่เที่ยวพูลวิลล่า | Pool Villa Finder',
    description: 'รวมบทความแนะนำที่พัก ที่เที่ยว และไกด์การจองพูลวิลล่าทั่วไทย',
};

export default async function ScoopListPage() {
    // ดึง Scoop ทั้งหมดที่ Publish แล้ว
    const scoops = await prisma.scoop.findMany({
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            coverImage: true,
            publishedAt: true,
        }
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20 pt-12">
            <main className="max-w-7xl mx-auto px-4">

                {/* --- HEADER --- */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-bold mb-4">
                        <BookOpen size={18} />
                        SCOOP & GUIDES
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
                        รวมบทความพูลวิลล่า
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        อัปเดตที่เที่ยวใหม่ๆ เทคนิคการเลือกจองบ้านพัก และไกด์นำเที่ยวที่คุณไม่ควรพลาด
                    </p>
                </div>

                {/* --- GRID LIST --- */}
                {scoops.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {scoops.map((scoop) => (
                            <Link
                                href={`/scoop/${scoop.slug}`}
                                key={scoop.id}
                                className="group bg-white rounded-3xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col"
                            >
                                {/* Image Wrap */}
                                <div className="aspect-[16/10] relative overflow-hidden bg-slate-100">
                                    <Image
                                        src={scoop.coverImage || '/placeholder.jpg'}
                                        alt={scoop.title}
                                        fill
                                        unoptimized
                                        referrerPolicy="no-referrer"
                                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                                    />
                                </div>

                                {/* Content */}
                                <div className="p-6 flex flex-col flex-grow">
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                                        <Calendar size={14} />
                                        {scoop.publishedAt ? new Date(scoop.publishedAt).toLocaleDateString('th-TH', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        }) : 'เร็วๆ นี้'}
                                    </div>

                                    <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                                        {scoop.title}
                                    </h2>

                                    <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed">
                                        {scoop.description}
                                    </p>

                                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-blue-600 font-bold text-sm">
                                        อ่านต่อเพิ่มเติม
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <ChevronRight size={18} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300">
                        <p className="text-slate-400">กำลังเตรียมข้อมูลบทความ...</p>
                    </div>
                )}
            </main>
        </div>
    );
}