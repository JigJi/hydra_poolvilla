/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/villa/[slug]/page.tsx
import React from 'react';
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import {
    MapPin, Users, Bed, Bath, Star, ArrowUpRight,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getFacilityIcon } from '@/lib/facility-icons';
import { Info } from 'lucide-react';
import VillaFacilities from "@/components/villa/VillaFacilities";
import VillaGallery from '@/components/villa/VillaGallery';
import RelatedVillas from '@/components/villa/RelatedVillas';
import VillaBookingCard from '@/components/villa/VillaBookingCard';
import NearbyPlaces from '@/components/villa/NearbyPlaces';
import VillaPolicies from '@/components/villa/VillaPolicies';
import VillaFAQ from '@/components/villa/VillaFAQ';

import RelatedScoops from '@/components/scoop/RelatedScoops';

// 🚀 แก้ไข: SEO Metadata ดึงชื่อวิลล่า ราคา และข้อมูลมาทำ Title/Description อัตโนมัติให้น่าคลิกสุดๆ
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    // ต้อง await params ก่อนเรียกใช้ slug ครับ
    const { slug } = await params;
    const villa = await prisma.villa.findUnique({ where: { slug } });

    if (!villa) return { title: 'Villa Not Found' };
    return {
        title: `${villa.title} | พูลวิลล่า ${villa.province} เริ่มต้น ฿${villa.priceDaily.toLocaleString()}`,
        description: `จองพูลวิลล่า ${villa.title} จังหวัด ${villa.province} พักได้สูงสุด ${villa.maxGuests} ท่าน มี ${villa.bedrooms} ห้องนอน สิ่งอำนวยความสะดวกครบครัน ราคาพิเศษ เริ่มต้นเพียง ฿${villa.priceDaily.toLocaleString()}/คืน`,
        alternates: {
            canonical: `/villa/${slug}`,
        },
        openGraph: {
            title: `${villa.title} | พูลวิลล่า ${villa.province}`,
            description: `พูลวิลล่า ${villa.province} ${villa.bedrooms} ห้องนอน ${villa.maxGuests} ท่าน เริ่มต้น ฿${villa.priceDaily.toLocaleString()}/คืน`,
            type: 'website',
            images: (villa.images as string[])?.[0] ? [{
                url: (villa.images as string[])[0],
                width: 1200,
                height: 630,
                alt: villa.title,
            }] : [],
        },
    };
}

// เพิ่ม ISR Strategy: Render หน้าใหม่ทุกๆ 1 ชั่วโมง (หรือตามความเหมาะสม)
export const revalidate = 3600;

// (Optional) ถ้า Villa เยอะมาก ให้ Generate เฉพาะ Top 100 ตัวแรก ส่วนที่เหลือให้ Server Render แล้ว Cache ทีหลัง
export async function generateStaticParams() {
    const topVillas = await prisma.villa.findMany({
        take: 100,
        select: { slug: true },
        orderBy: { updatedAt: 'desc' } // หรือเรียงตาม View Count
    });

    return topVillas.map((villa) => ({
        slug: villa.slug,
    }));
}

export default async function VillaDetailPage({ params }: { params: Promise<{ slug: string }> }) {

    // ต้อง await params ก่อนเริ่มดึงข้อมูลจาก DB ครับ
    const { slug } = await params;

    // 1. ดึงข้อมูลวิลล่าจาก DB
    const villa = await prisma.villa.findUnique({
        where: { slug: slug },
    });

    if (!villa) notFound();

    // ✅ FIX 1: ดึง facilities ออกมาจาก villa และกันค่า Null (Fallback)
    const facilities = (villa.facilities as any) || { popular: [] };

    // ดึง Tags (เหมือนหน้า Scoop)
    let displayTags: any[] = [];
    try {
        displayTags = Array.isArray(villa.facility_tags)
            ? villa.facility_tags
            : JSON.parse(villa.facility_tags as string || '[]');
    } catch (e) { displayTags = []; }


    // 2. แปลงข้อมูล (Casting)
    const images = (villa.images as string[]) || [];

    // แปลงราคาให้ดูสวย (มีลูกเล่นลดราคาหลอกๆ เพื่อความน่าสนใจ)
    const fakeOriginalPrice = Math.round(villa.priceDaily * 1.3);

    // 🚀 เพิ่ม: สร้าง Schema.org สำหรับ Google (LodgingBusiness) เพื่อทำดาวเหลือง
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        "name": villa.title,
        "image": (villa.images as string[])[0] || "",
        "description": `พูลวิลล่า ${villa.province} จำนวน ${villa.bedrooms} ห้องนอน พักได้ ${villa.maxGuests} ท่าน`,
        "address": {
            "@type": "PostalAddress",
            "addressLocality": villa.district,
            "addressRegion": villa.province,
            "addressCountry": "TH"
        },
        "priceRange": `฿${villa.priceDaily.toLocaleString()}`,
        ...(villa.rating && {
            "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": villa.rating,
                "reviewCount": villa.reviewCount || 15,
                "bestRating": "10",
                "worstRating": "1"
            }
        })
    };


    // คำนวณราคาต่อหัว (เพิ่มบรรทัดนี้ไว้ก่อน return)
    const perPerson = Math.round(villa.priceDaily / (villa.maxGuests || 1));

    // 🔍 RELATED VILLAS LOGIC: หาบ้านที่ "ใกล้เคียง"
    // เงื่อนไข: 1. อยู่โซนเดียวกัน 2. ไม่ใช่หลังปัจจุบัน 3. (Optional) ราคา/ห้องนอน ใกล้เคียงกัน
    // 1. กำหนด Critical Tags ที่เราแคร์ (ถ้าบ้านหลักมี บ้านที่แนะนำก็ "ควรจะมี")
    // เช็คจาก facility_tags ใน DB ของคุณ
    const currentTags = Array.isArray(villa.facility_tags) ? villa.facility_tags : [];
    const isPetFriendly = currentTags.includes('pet_friendly') || currentTags.includes('pets_allowed');
    const hasKaraoke = currentTags.includes('karaoke');
    const hasPool = currentTags.includes('private_pool');

    // 2. ดึง Candidates (ผู้ท้าชิง) มาก่อนสัก 20 หลัง (กรองด้วย Location & Capacity & Price)
    const candidates = await prisma.villa.findMany({
        where: {
            id: { not: villa.id }, // ไม่เอาตัวเอง
            province: villa.province, // ใช้ province แทน location เพื่อวงกว้างขึ้นหน่อยแล้วค่อยกรอง
            maxGuests: {
                gte: Math.max(1, (villa.maxGuests || 2) - 4), // รับคนได้น้อยกว่านิดหน่อย
                lte: (villa.maxGuests || 2) + 4               // รับคนได้มากกว่านิดหน่อย
            },
            priceDaily: {
                gte: villa.priceDaily * 0.6, // ราคา +/- 40%
                lte: villa.priceDaily * 1.4
            },
            // ถ้าบ้านหลักรับสัตว์เลี้ยง ให้บังคับเลยว่าบ้านแนะนำต้องรับด้วย (Strict Rule)
            ...(isPetFriendly ? {
                facility_tags: {
                    array_contains: 'pet_friendly'
                }
            } : {})
        },
        take: 20, // ดึงมาเผื่อเลือก
        select: {
            id: true,
            title: true,
            slug: true,
            images: true,
            priceDaily: true,
            bedrooms: true,
            maxGuests: true,
            province: true,
            district: true, // เอามาโชว์ Location ให้ละเอียดขึ้น
            facility_tags: true, // เอามาเทียบคะแนน
        }
    });

    // 3. Scoring System (ให้คะแนนความเหมือน)
    const scoredVillas = candidates.map((candidate) => {
        let score = 0;
        const cTags = Array.isArray(candidate.facility_tags) ? candidate.facility_tags : [];

        // Feature Matching Score
        if (hasKaraoke && cTags.includes('karaoke')) score += 5; // คาราโอเกะตรงกัน +5
        if (hasPool && cTags.includes('private_pool')) score += 3; // สระเหมือนกัน +3

        // Location Matching Score (ถ้า District ตรงกัน ให้คะแนนพิเศษ)
        if (candidate.district === villa.district) score += 10;

        // Price Similarity (ราคายิ่งใกล้ ยิ่งคะแนนเยอะ)
        const priceDiff = Math.abs(candidate.priceDaily - villa.priceDaily);
        if (priceDiff < 1000) score += 5;

        return { ...candidate, score };
    });

    // 4. Sort & Slice (เรียงคะแนนจากมากไปน้อย แล้วตัดมา 5 อันดับแรก)
    const relatedVillas = scoredVillas
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://poolvillafinder.com' },
            { '@type': 'ListItem', position: 2, name: `พูลวิลล่า ${villa.province}`, item: `https://poolvillafinder.com/search?province=${villa.province}` },
            { '@type': 'ListItem', position: 3, name: villa.title },
        ],
    };

    return (
        <div className="min-h-screen bg-white pb-20 font-sans text-slate-900">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            <main className="max-w-7xl mx-auto px-4 py-6">

                {/* ✅ ADD: Breadcrumb แบบ Minimal (แทนปุ่ม Back) */}
                <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                    <Link href="/" className="hover:text-blue-600 transition">หน้าแรก</Link>
                    <ChevronRight size={14} />
                    <span className="text-slate-900 font-medium truncate max-w-[200px]">{villa.title}</span>
                </div>

                {/* --- HERO GALLERY (Optimized with next/image) --- */}
                <VillaGallery images={images} title={villa.title} />

                {/* --- COMPACT CONTENT LAYOUT (Line First, Tags Second) --- */}
                <div className="space-y-6 mt-6">

                    {/* 1. HEADER: Title & Tags (เอา Price ออกไปใส่ Sidebar) */}
                    <div className="mb-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight">{villa.title}</h1>
                                {(villa.rating ?? 0) > 0 && (
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-base font-bold text-slate-600 border border-slate-100">
                                        <Star size={16} className="text-orange-400 fill-orange-400" />
                                        {villa.rating ?? 0} ({villa.reviewCount ?? 0})
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-sm text-slate-600">
                                <div className="flex items-center gap-1.5 font-medium text-slate-500">
                                    <MapPin size={16} className="text-red-500 shrink-0" />
                                    {villa.address || `${villa.subDistrict}, ${villa.district}, ${villa.province}`}
                                </div>
                                <div className="hidden md:block w-px h-3 bg-slate-300"></div>
                                <div className="flex items-center gap-4 font-medium text-slate-700">
                                    <span className="flex items-center gap-1.5"><Users size={16} /> {villa.maxGuests} ท่าน</span>
                                    <span className="flex items-center gap-1.5"><Bed size={16} /> {villa.bedrooms} นอน</span>
                                    <span className="flex items-center gap-1.5"><Bath size={16} /> {villa.bathrooms} น้ำ</span>
                                </div>
                            </div>
                        </div>

                        {/* Facility Tags (Top Pills) - เก็บไว้ดึงดูดสายตา */}
                        {displayTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-6">
                                {displayTags.map((tag: any, index: number) => {
                                    const IconComponent = getFacilityIcon(tag.icon, 'CheckCircle');
                                    return (
                                        <div key={index} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-slate-700 text-xs font-bold hover:border-blue-500 hover:bg-blue-50 transition cursor-default">
                                            <IconComponent size={14} className="text-blue-500" />
                                            <span>{tag.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 2. MAIN CONTENT: Description & Booking Card (ROW 1) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start relative mb-12">

                        {/* LEFT: Description (66%) */}
                        <div className="md:col-span-2 space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Info size={24} className="text-blue-600" />
                                เกี่ยวกับที่พัก
                            </h3>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-base">
                                <p className="whitespace-pre-line">
                                    {villa.content_detail || "ไม่มีรายละเอียดเพิ่มเติม"}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Booking Card (Compact Version) - Sticky */}
                        <VillaBookingCard villa={villa} perPerson={perPerson} />

                    </div>

                    {/* 3. FACILITIES SECTION (ROW 2 - Full Width) */}
                    <div className="mb-16">
                        <VillaFacilities data={facilities} />
                    </div>

                    {/* 4. LOCATION & DISTANCES */}
                    <NearbyPlaces villa={villa} />

                    {/* 5. RULES & POLICIES */}
                    <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-20 items-start">

                        {/* LEFT COLUMN: House Rules */}
                        <VillaPolicies policies={villa.policies} />

                        {/* RIGHT COLUMN: FAQ (Fix: Flatten all categories to find hidden items) */}
                        <VillaFAQ facilities={villa.facilities} />

                    </div>

                    {/* divider */}
                    <div className="border-t border-slate-100 my-16"></div>

                    {/* --- SECTION: RELATED VILLAS (Slider Version) --- */}
                    <RelatedVillas villas={relatedVillas} currentLocation={villa.province} />

                    {/* --- SECTION: RELATED SCOOPS (PSEO Network) --- */}
                    <RelatedScoops
                        currentProvince={villa.province}
                        currentDistrict={villa.district}
                    />

                    {/* Margin Bottom ปิดท้ายหน้า */}
                    <div className="mb-24"></div>

                </div>

            </main>

            {/* Mobile Footer (เหมือนเดิม) */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 md:hidden z-50 flex items-center justify-between shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-slate-900">฿{villa.priceDaily.toLocaleString()}</span>
                        <span className="text-xs text-slate-500 line-through">฿{fakeOriginalPrice.toLocaleString()}</span>
                    </div>
                </div>
                <Button className="bg-blue-600 font-bold px-8 shadow-blue-200 shadow-lg">จองเลย</Button>
            </div>
        </div>
    );
}