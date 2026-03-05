// src/components/scoop/RelatedScoops.tsx
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Link from 'next/link';
import { prisma } from "@/lib/prisma";
import { BookOpen, MapPin } from 'lucide-react';

interface Scoop {
    id: number;
    slug: string;
    title: string;
    coverImage: string | null;
    rule: any;
}

export default async function RelatedScoops({
    currentProvince,
    currentDistrict,
    currentScoopId
}: {
    currentProvince: string;
    currentDistrict: string;
    currentScoopId?: number;
}) {
    // สร้าง search terms จากทั้ง district และ province
    const searchTerms: { slug: string; title: string }[] = [];

    if (currentDistrict) {
        searchTerms.push({
            slug: currentDistrict.toLowerCase().replace(/\s+/g, '-'),
            title: currentDistrict,
        });
    }
    if (currentProvince) {
        searchTerms.push({
            slug: currentProvince.toLowerCase().replace(/\s+/g, '-'),
            title: currentProvince,
        });
    }

    if (searchTerms.length === 0) return null;

    const orConditions = searchTerms.flatMap((t) => [
        { slug: { contains: t.slug, mode: 'insensitive' as const } },
        { title: { contains: t.title, mode: 'insensitive' as const } },
    ]);

    const rawScoops = await prisma.scoop.findMany({
        where: {
            status: 'published',
            id: currentScoopId ? { not: currentScoopId } : undefined,
            // กรอง scoop เก่าออก
            NOT: { slug: { startsWith: 'pool-villas-' } },
            OR: orConditions,
        },
        take: 9,
        orderBy: { publishedAt: 'desc' },
        select: { id: true, slug: true, title: true, coverImage: true, rule: true },
    });

    if (rawScoops.length === 0) return null;

    const displayLocation = currentDistrict || currentProvince;

    return (
        <div className="mt-16 mb-8 border-t border-slate-100 pt-12">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2 mb-6">
                <BookOpen size={28} className="text-blue-600" />
                บทความแนะนำและที่เที่ยว{displayLocation}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rawScoops.map((scoop: Scoop) => {
                    const scoopRule = typeof scoop.rule === 'string' ? JSON.parse(scoop.rule) : (scoop.rule || {});
                    const scoopDistrict = scoopRule.district || '';
                    const scoopProvince = scoopRule.province || '';
                    const locationLabel = [scoopDistrict, scoopProvince].filter(Boolean).join(', ') || displayLocation;

                    return (
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
                                    <span className="truncate">{locationLabel}</span>
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
