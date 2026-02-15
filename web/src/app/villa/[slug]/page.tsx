// src/app/villa/[slug]/page.tsx
import React from 'react';
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from 'next/link';
import Image from "next/image";
import {
    MapPin, Users, Bed, BedDouble, Bath, Wifi, CheckCircle,
    ChevronLeft, Share, Heart, Star, ArrowUpRight,
    X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import * as LucideIcons from 'lucide-react';
import VillaFacilities from "@/components/villa/VillaFacilities";
import VillaGallery from '@/components/villa/VillaGallery';
import RelatedVillas from '@/components/villa/RelatedVillas';


// SEO Metadata: ดึงชื่อวิลล่ามาทำ Title อัตโนมัติ
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    // ต้อง await params ก่อนเรียกใช้ slug ครับ
    const { slug } = await params;
    const villa = await prisma.villa.findUnique({ where: { slug } });

    if (!villa) return { title: 'Villa Not Found' };
    return {
        title: `${villa.title} | PoolVillaFinder`,
        description: villa.description?.slice(0, 160) || `พูลวิลล่าสวยๆ ใน ${villa.province}`,
        openGraph: {
            images: (villa.images as string[])?.[0] || '',
        }
    };
}

// Define Type ให้ตรงกับที่ Component ต้องการ (หรือ import มา)
interface FacilityData {
    popular: string[];
    categories: { name: string; items: string[] }[];
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
        where: { slug: params.slug },
    });

    // ✅ FIX 1: ดึง facilities ออกมาจาก villa และกันค่า Null (Fallback)
    const facilities = (villa.facilities as any) || { popular: [] };

    // ดึง Tags (เหมือนหน้า Scoop)
    let displayTags: any[] = [];
    try {
        displayTags = Array.isArray(villa.facility_tags)
            ? villa.facility_tags
            : JSON.parse(villa.facility_tags as string || '[]');
    } catch (e) { displayTags = []; }

    if (!villa) notFound();

    // 2. แปลงข้อมูล (Casting)
    const images = (villa.images as string[]) || [];

    type VillaAmenities = {
        wifi?: boolean;
        pool?: boolean;
        kitchen?: boolean;
        karaoke?: boolean;
        grill?: boolean;
    };
    const amenities = (villa.amenities as VillaAmenities) || {};

    // แปลงราคาให้ดูสวย (มีลูกเล่นลดราคาหลอกๆ เพื่อความน่าสนใจ)
    const fakeOriginalPrice = Math.round(villa.priceDaily * 1.3);

    // สร้าง Schema.org สำหรับ Google
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'VacationRental',
        name: villa.title,
        description: villa.content_detail,
        image: images,
        address: {
            '@type': 'PostalAddress',
            addressLocality: villa.district,
            addressRegion: villa.province,
            addressCountry: 'TH'
        },
        numberOfRooms: villa.bedrooms,
        occupancy: {
            '@type': 'QuantitativeValue',
            value: villa.maxGuests,
            unitCode: 'C62' // Person
        },
        offers: {
            '@type': 'Offer',
            price: villa.priceDaily,
            priceCurrency: 'THB',
            availability: 'https://schema.org/InStock',
        },
        "amenityFeature": facilities.popular?.map((item: string) => ({
            "@type": "LocationFeatureSpecification",
            "name": item,
            "value": true
        })) || [], // กันพังอีกชั้นถ้า popular เป็น undefined
    }

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
                    has: 'pet_friendly' // หรือ tag ที่คุณใช้จริงใน DB
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

    return (
        <div className="min-h-screen bg-white pb-20 font-sans text-slate-900">

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
                                {villa.rating > 0 && (
                                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md text-base font-bold text-slate-600 border border-slate-100">
                                        <Star size={16} className="text-orange-400 fill-orange-400" />
                                        {villa.rating} ({villa.reviewCount})
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
                                    const IconComponent = (LucideIcons as any)[tag.icon] || LucideIcons.CheckCircle;
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
                                <LucideIcons.Info size={24} className="text-blue-600" />
                                เกี่ยวกับที่พัก
                            </h3>
                            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-base">
                                <p className="whitespace-pre-line">
                                    {villa.content_detail || "ไม่มีรายละเอียดเพิ่มเติม"}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Booking Card (Compact Version) - Sticky */}
                        <div className="md:col-span-1 sticky top-24 z-20">
                            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">

                                <div className="p-5 space-y-4"> {/* ลด Padding เป็น 5 */}

                                    {/* Price Header (Compact) */}
                                    <div>
                                        <div className="text-slate-400 text-xs line-through font-medium">
                                            ฿{fakeOriginalPrice.toLocaleString()}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-black text-slate-900 tracking-tight"> {/* ลดเหลือ 3xl */}
                                                ฿{villa.priceDaily.toLocaleString()}
                                            </span>
                                            <span className="text-sm font-bold text-slate-500">/ คืน</span>
                                        </div>
                                    </div>

                                    {/* Per Person Box (Slimmer) */}
                                    <div className="bg-slate-50 border border-slate-100 rounded-lg py-2 px-3 text-center">
                                        <span className="text-lg text-slate-600 font-medium">
                                            ตกคนละ <span className="text-blue-600 font-bold">฿{perPerson.toLocaleString()}</span>
                                        </span>
                                    </div>

                                    {/* CTA Button (Standard Size) */}
                                    <a
                                        href={villa.sourceUrl || "#"}
                                        target="_blank"
                                        rel="nofollow noopener noreferrer"
                                        className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold py-3 rounded-xl shadow-md transition-all transform active:scale-[0.98]"
                                    >
                                        เช็คราคา & จอง <ArrowUpRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </a>

                                    {/* Trust Signal (Smaller) */}
                                    <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
                                        <LucideIcons.ShieldCheck size={14} className="text-green-500" />
                                        <span>จองตรงปลอดภัย 100%</span>
                                    </div>
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* 3. FACILITIES SECTION (ROW 2 - Full Width) */}
                    <div className="mb-16">
                        <VillaFacilities data={facilities} />
                    </div>

                    {/* 4. LOCATION & DISTANCES */}
                    <div className="mt-12 md:mt-16">

                        <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                            <MapPin size={24} className="text-blue-600" />
                            ทำเลที่ตั้ง & สถานที่ยอดนิยม
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">

                            {/* Left: Google Map (Real Data) */}
                            <div className="space-y-4 h-full">
                                <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">

                                    {/* Logic: สร้าง URL จาก latitude, longitude ใน DB */}
                                    {(() => {
                                        const lat = villa.latitude ?? 12.9236;
                                        const lng = villa.longitude ?? 100.8825;

                                        return (
                                            <iframe
                                                className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500 object-cover" // เพิ่ม object-cover กันภาพเบี้ยว
                                                src={`https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                                                loading="lazy"
                                                referrerPolicy="no-referrer-when-downgrade"
                                                title="Villa Location"
                                            ></iframe>
                                        );
                                    })()}

                                    {/* ปุ่มกดดูแผนที่ใหญ่ (External Link) */}
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${villa.latitude},${villa.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-white transition flex items-center gap-2"
                                    >
                                        <LucideIcons.ExternalLink size={16} /> ดูแผนที่ Google Maps
                                    </a>
                                </div>
                            </div>

                            {/* Right: Nearby Places List (Logic จัดหมวดหมู่) */}
                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-fit">

                                {/* 1. Preparation Logic (เขียนตรงนี้เลยหรือแยก function ก็ได้) */}
                                {(() => {
                                    // Parse Data (ถ้ามาเป็น string ให้ parse ก่อน)
                                    const places = typeof villa.nearbyPlaces === 'string'
                                        ? JSON.parse(villa.nearbyPlaces)
                                        : (villa.nearbyPlaces || []);

                                    // Helper เลือก Icon ตามหมวดหมู่
                                    const getPlaceIcon = (cat: string) => {
                                        if (cat.includes('ชายหาด')) return <LucideIcons.Palmtree size={18} className="text-orange-500" />;
                                        if (cat.includes('สนามบิน') || cat.includes('ท่าเรือ')) return <LucideIcons.Plane size={18} className="text-blue-500" />;
                                        if (cat.includes('ร้านอาหาร') || cat.includes('คาเฟ่')) return <LucideIcons.Utensils size={18} className="text-green-500" />;
                                        return <LucideIcons.MapPin size={18} className="text-slate-400" />;
                                    };

                                    // Grouping: แยก Beach/Airport ออกมาให้เด่น
                                    const highlights = places.filter((p: any) =>
                                        p.category.includes('ชายหาด') || p.category.includes('สนามบิน')
                                    );
                                    const others = places.filter((p: any) =>
                                        !p.category.includes('ชายหาด') && !p.category.includes('สนามบิน')
                                    ).slice(0, 5); // เอาตัวรองๆ มาแค่ 5 อันพอ

                                    return (
                                        <div className="space-y-6">

                                            {/* Group 1: Highlights (Beach & Airport) - สำคัญสุด */}
                                            {highlights.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
                                                        จุดแลนด์มาร์คสำคัญ
                                                    </h4>
                                                    <ul className="space-y-3">
                                                        {highlights.map((place: any, i: number) => (
                                                            <li key={i} className="flex items-center justify-between text-sm group">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-white p-1.5 rounded-md border border-slate-200 shadow-sm group-hover:border-blue-300 transition">
                                                                        {getPlaceIcon(place.category)}
                                                                    </div>
                                                                    <span className="text-slate-700 font-medium">{place.name}</span>
                                                                </div>
                                                                <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded border border-slate-100 text-xs">
                                                                    {place.distance}
                                                                </span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {/* Divider */}
                                            {highlights.length > 0 && others.length > 0 && <Separator className="bg-slate-200" />}

                                            {/* Group 2: Others (Restaurants, Attractions) */}
                                            {others.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
                                                        สถานที่ใกล้อื่นๆ
                                                    </h4>
                                                    <ul className="space-y-2">
                                                        {others.map((place: any, i: number) => (
                                                            <li key={i} className="flex items-center justify-between text-sm text-slate-600">
                                                                <span className="truncate pr-4">• {place.name}</span>
                                                                <span className="whitespace-nowrap text-xs text-slate-400">{place.distance}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                        </div>
                                    );
                                })()}

                            </div>

                        </div>
                    </div>

                    {/* 5. RULES & POLICIES */}
                    <div className="mt-12 md:mt-16 grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-20 items-start">

                        {/* LEFT COLUMN: House Rules (Final Complete Version) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <LucideIcons.ClipboardList size={24} className="text-blue-600" />
                                กฎระเบียบและข้อตกลง
                            </h3>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm h-full">

                                {(() => {
                                    // 1. Parsing Data
                                    let policies: any[] = [];
                                    try {
                                        if (typeof villa.policies === 'string') policies = JSON.parse(villa.policies);
                                        else if (Array.isArray(villa.policies)) policies = villa.policies;
                                    } catch (e) { policies = []; }

                                    // 2. Helper to find policy by keyword (Flexible)
                                    const findPolicy = (keywords: string[]) =>
                                        policies.find((p: any) => keywords.some(k => p.topic.includes(k)));

                                    const extractTime = (text: string) => text ? (text.match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/)?.[0] || "-") : "-";

                                    // 3. Extract Core Data
                                    const checkIn = findPolicy(['เช็คอิน']);
                                    const checkOut = findPolicy(['เช็คเอาท์']);

                                    // Check-out Logic: บางทีมาเป็นช่วง "07:00 ถึง 11:00" เราควรเอาเลขหลัง (11:00) เป็นเวลาออกหลัก
                                    let checkOutTime = "11:00"; // Default
                                    if (checkOut?.content) {
                                        const times = checkOut.content.match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/g);
                                        if (times && times.length > 1) checkOutTime = times[1]; // เอาเวลาตัวหลัง
                                        else if (times && times.length === 1) checkOutTime = times[0];
                                    }

                                    return (
                                        <>
                                            {/* A. TIME SLOT CARD */}
                                            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 bg-white p-5 rounded-xl border border-slate-200">
                                                <div className="text-center w-full sm:w-1/2 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <LucideIcons.LogIn size={16} className="text-slate-400" />
                                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Check-in</span>
                                                    </div>
                                                    <div className="text-3xl font-black text-slate-900">
                                                        {checkIn ? extractTime(checkIn.content) : "14:00"}
                                                    </div>
                                                </div>
                                                <div className="w-full h-px bg-slate-100 sm:hidden my-2"></div>
                                                <div className="text-center w-full sm:w-1/2 pt-4 sm:pt-0 sm:pl-4">
                                                    <div className="flex items-center justify-center gap-2 mb-1">
                                                        <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Check-out</span>
                                                        <LucideIcons.LogOut size={16} className="text-slate-400" />
                                                    </div>
                                                    <div className="text-3xl font-black text-slate-900">
                                                        {checkOutTime}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* B. POLICIES LIST */}
                                            <ul className="space-y-5">

                                                {/* 1. Pets */}
                                                {(() => {
                                                    const pet = findPolicy(['สัตว์เลี้ยง']);
                                                    if (!pet) return null;
                                                    const isAllowed = pet.content.includes('อนุญาต') && !pet.content.includes('ไม่อนุญาต');
                                                    return (
                                                        <li className="flex gap-4 items-start">
                                                            <div className={`p-2.5 rounded-full border shrink-0 ${isAllowed ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
                                                                <LucideIcons.PawPrint size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-sm mb-0.5">สัตว์เลี้ยง</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed block">
                                                                    {pet.content}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    );
                                                })()}

                                                {/* 2. Deposit (เพิ่มใหม่: เงินประกัน) */}
                                                {(() => {
                                                    const deposit = findPolicy(['เงินประกัน', 'มัดจำ', 'ความเสียหาย']);
                                                    if (!deposit) return null;
                                                    return (
                                                        <li className="flex gap-4 items-start">
                                                            <div className="bg-white p-2.5 rounded-full border border-slate-200 shrink-0 text-orange-500 shadow-sm">
                                                                <LucideIcons.Coins size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-sm mb-0.5">{deposit.topic}</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed block">
                                                                    {deposit.content}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    );
                                                })()}

                                                {/* 3. Noise & Party (เพิ่มใหม่: เสียงดัง/ปาร์ตี้) */}
                                                {(() => {
                                                    const party = findPolicy(['ปาร์ตี้', 'เสียงดัง', 'งานเลี้ยง']);
                                                    if (!party) return null;
                                                    return (
                                                        <li className="flex gap-4 items-start">
                                                            <div className="bg-white p-2.5 rounded-full border border-slate-200 shrink-0 text-red-500 shadow-sm">
                                                                <LucideIcons.VolumeX size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-sm mb-0.5">{party.topic}</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed block">
                                                                    {party.content}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    );
                                                })()}

                                                {/* 4. Children & Extra Bed */}
                                                {(() => {
                                                    const child = findPolicy(['เด็ก', 'เตียงเสริม']);
                                                    if (!child) return null;
                                                    return (
                                                        <li className="flex gap-4 items-start">
                                                            <div className="bg-white p-2.5 rounded-full border border-slate-200 shrink-0 text-blue-500 shadow-sm">
                                                                <LucideIcons.Baby size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-sm mb-0.5">เด็กและเตียงเสริม</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed block line-clamp-3">
                                                                    {child.content}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    );
                                                })()}

                                                {/* 5. Age Restriction (เพิ่มใหม่: จำกัดอายุ) */}
                                                {(() => {
                                                    const age = findPolicy(['ข้อจำกัดด้านอายุ', 'อายุ']);
                                                    // กรองเคส "ไม่จำกัดอายุ" ออก จะได้ไม่รก (หรือจะโชว์ก็ได้ถ้าต้องการ)
                                                    if (!age || age.content.includes('ไม่จำกัด')) return null;

                                                    return (
                                                        <li className="flex gap-4 items-start">
                                                            <div className="bg-white p-2.5 rounded-full border border-slate-200 shrink-0 text-slate-500 shadow-sm">
                                                                <LucideIcons.UserX size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-sm mb-0.5">{age.topic}</span>
                                                                <span className="text-slate-600 text-sm leading-relaxed block">
                                                                    {age.content}
                                                                </span>
                                                            </div>
                                                        </li>
                                                    );
                                                })()}

                                            </ul>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* RIGHT COLUMN: FAQ (Fix: Flatten all categories to find hidden items) */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <LucideIcons.HelpCircle size={24} className="text-blue-600" />
                                คำถามที่พบบ่อย
                            </h3>

                            <div className="space-y-4">
                                {(() => {
                                    // 🛠️ 1. ROBUST DATA EXTRACTION (แก้ตรงนี้!)
                                    // รวมข้อมูลจากทั้ง popular และ categories ทุกหมวดมารวมกันเป็น list เดียว
                                    let allFacilities: string[] = [];

                                    // 1.1 ลองดึงจาก popular
                                    if ((villa.facilities as any)?.popular) {
                                        allFacilities = [...allFacilities, ...(villa.facilities as any).popular];
                                    }

                                    // 1.2 ลองดึงจาก categories (สำคัญมาก! ข้อมูลมักซ่อนอยู่ในนี้)
                                    if ((villa.facilities as any)?.categories) {
                                        (villa.facilities as any).categories.forEach((cat: any) => {
                                            if (Array.isArray(cat.items)) {
                                                allFacilities = [...allFacilities, ...cat.items];
                                            }
                                        });
                                    }

                                    // 1.3 เผื่อกรณีเป็น Array ธรรมดา (Flat list)
                                    if (Array.isArray(villa.facilities)) {
                                        allFacilities = [...allFacilities, ...villa.facilities];
                                    }

                                    // Helper ค้นหา Keyword (ค้นหาจาก list ที่รวมมาแล้ว)
                                    const hasItem = (keywords: string[]) => allFacilities.some((f: string) => keywords.some(k => f.toLowerCase().includes(k.toLowerCase())));

                                    const faqItems = [];

                                    // --- Q1: อาหารเช้า ---
                                    const hasBreakfast = hasItem(['อาหารเช้า', 'Breakfast']);
                                    faqItems.push({
                                        question: "มีอาหารเช้าไหม?",
                                        answer: hasBreakfast
                                            ? "มีบริการอาหารเช้าฟรีสำหรับผู้เข้าพักครับ"
                                            : "ราคาที่พักไม่รวมอาหารเช้าครับ (เป็นบ้านพักส่วนตัว) แต่เรามีห้องครัว ตู้เย็น และอุปกรณ์ทำอาหารครบชุด ลูกค้าสามารถเตรียมวัตถุดิบมาทำเองได้สะดวกมากครับ"
                                    });

                                    // --- Q2: ปิ้งย่าง ---
                                    const hasBBQ = hasItem(['เตา', 'ปิ้งย่าง', 'BBQ', 'Grill']);
                                    if (hasBBQ) {
                                        faqItems.push({
                                            question: "ปิ้งย่างได้ไหม?",
                                            answer: "ปิ้งย่างได้ครับ! เรามีเตา BBQ และอุปกรณ์ปิ้งย่างเตรียมไว้ให้พร้อม ลูกค้าเตรียมแค่อาหารสด น้ำจิ้ม และถ่านมาก็ปาร์ตี้ได้เลยครับ"
                                        });
                                    }

                                    // --- Q3: คาราโอเกะ ---
                                    const hasKaraoke = hasItem(['คาราโอเกะ', 'Karaoke', 'ร้องเพลง', 'ลำโพง']);
                                    if (hasKaraoke) {
                                        faqItems.push({
                                            question: "มีคาราโอเกะไหม?",
                                            answer: "มีครับ! บ้านพักมีชุดคาราโอเกะพร้อมเครื่องเสียงคุณภาพดี ให้คุณร้องเพลงสังสรรค์ได้เต็มที่ (ภายในตัวบ้าน)"
                                        });
                                    }

                                    // --- Q4: อุปกรณ์ครัว ---
                                    const kitchenKeywords = ['ครัว', 'ตู้เย็น', 'ไมโครเวฟ', 'กระทะ', 'หม้อ', 'จาน', 'ชาม'];
                                    // Filter จาก allFacilities แทน facilities เดิม
                                    const kitchenGear = allFacilities.filter((f: string) =>
                                        kitchenKeywords.some(k => f.toLowerCase().includes(k))
                                    );
                                    // ลบคำซ้ำ (เผื่อมีหลายหมวด)
                                    const uniqueKitchenGear = Array.from(new Set(kitchenGear));

                                    if (uniqueKitchenGear.length > 0) {
                                        faqItems.push({
                                            question: "ทำอาหารได้ไหม มีอุปกรณ์อะไรบ้าง?",
                                            answer: `ทำอาหารได้ครับ ในบ้านมีอุปกรณ์เตรียมไว้ให้: ${uniqueKitchenGear.slice(0, 5).join(', ')}${uniqueKitchenGear.length > 5 ? ' และอื่นๆ' : ''} (ลูกค้าเตรียมแค่วัตถุดิบและเครื่องปรุงมาครับ)`
                                        });
                                    }

                                    // --- Q5: ที่จอดรถ ---
                                    const parking = allFacilities.find((f: string) => f.includes('จอดรถ'));
                                    if (parking) {
                                        faqItems.push({
                                            question: "มีที่จอดรถไหม?",
                                            answer: `มีครับ ${parking} (ปลอดภัยและสะดวกสบายครับ)`
                                        });
                                    }

                                    // --- Q6: Wi-Fi ---
                                    const wifi = allFacilities.find((f: string) => f.toLowerCase().includes('wifi') || f.includes('เน็ต'));
                                    if (wifi) {
                                        faqItems.push({
                                            question: "มี Wi-Fi ให้ใช้ไหม?",
                                            answer: "มีบริการ Free Wi-Fi ความเร็วสูงทั่วบริเวณบ้านพักครับ"
                                        });
                                    }

                                    // Fallback
                                    if (faqItems.length === 0) {
                                        return (
                                            <div className="bg-slate-50 rounded-xl p-4 text-center text-slate-400 text-sm">
                                                ไม่มีข้อมูลคำถามเพิ่มเติม
                                            </div>
                                        );
                                    }

                                    return faqItems.map((item, index) => (
                                        <div key={index} className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-200">
                                            <details className="group p-4 [&_summary::-webkit-details-marker]:hidden">
                                                <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900">
                                                    <h4 className="font-bold text-base">{item.question}</h4>
                                                    <div className="bg-slate-50 p-1.5 rounded-full text-slate-500 group-open:bg-blue-50 group-open:text-blue-600 transition">
                                                        <LucideIcons.ChevronDown size={18} className="group-open:rotate-180 transition-transform" />
                                                    </div>
                                                </summary>
                                                <div className="mt-4 leading-relaxed text-slate-600 text-sm border-t border-slate-100 pt-3">
                                                    {item.answer}
                                                </div>
                                            </details>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>

                    </div>

                    {/* divider */}
                    <div className="border-t border-slate-100 my-16"></div>

                    {/* --- SECTION: RELATED VILLAS (Slider Version) --- */}
                    <RelatedVillas villas={relatedVillas} currentLocation={villa.location} />

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