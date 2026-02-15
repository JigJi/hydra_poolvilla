import React, { cache } from 'react';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import * as LucideIcons from 'lucide-react';

import {
    MapPin,
    Users,
    BedDouble,
    Star,
    Quote,
    ChevronRight,
    CheckCircle2,
    Mic2,
    Waves,
    Target,
    Flame,
    ArrowUpRight,
    HelpCircle // เพิ่มมาแค่ตัวเดียวสำหรับ FAQ
} from 'lucide-react';
import { Metadata } from 'next';

// Revalidate ทุก 1 ชั่วโมง
export const revalidate = 3600;

// TAG_PRIORITY (คงเดิม)
const TAG_PRIORITY = [
    'karaoke', 'slider', 'pool_table', 'bbq',
    'beachfront', 'smoking_area', 'pet_friendly', 'salt_water_pool',
    'kitchen', 'kid_friendly', 'accessibility', 'wifi'
];

// --- Helper: Cache การดึงข้อมูล ---
const getScoop = cache(async (slug: string) => {
    return await prisma.scoop.findUnique({
        where: { slug }
    });
});

// --- Helper: แปลง Rule (ตัวใหม่ที่ฉลาดขึ้น รองรับ JSON จริงๆ) ---
const parseRuleToPrisma = (ruleData: any) => {
    const where: any = { isActive: true };
    const orderBy: any = {};
    let take = 10;

    if (!ruleData) return { where, orderBy, take };

    try {
        const rule = typeof ruleData === 'string' ? JSON.parse(ruleData) : ruleData;

        if (rule.province) where.province = rule.province;
        if (rule.district) where.district = rule.district;
        if (rule.minReviewCount) where.reviewCount = { gte: Number(rule.minReviewCount) };
        if (rule.price_max) where.priceDaily = { lte: Number(rule.price_max) };
        if (rule.guests_min) where.maxGuests = { gte: Number(rule.guests_min) };

        const sortField = rule.sortBy || 'rating';
        const sortOrder = rule.order || 'desc';

        switch (sortField) {
            case 'rating': orderBy.rating = sortOrder; break;
            case 'price': orderBy.priceDaily = sortOrder; break;
            case 'reviewCount': case 'reviews': orderBy.reviewCount = sortOrder; break;
            case 'date': case 'newest': orderBy.createdAt = sortOrder; break;
            default: orderBy[sortField] = sortOrder;
        }

        if (rule.limit) take = Number(rule.limit);

    } catch (e) {
        console.error("Error parsing rule:", e);
    }
    return { where, orderBy, take };
};

// แกะระยะทางจากสถานที่ใกล้เคียง (คงเดิม)
const getDistanceToSea = (nearbyPlaces: any) => {
    try {
        const places = typeof nearbyPlaces === 'string' ? JSON.parse(nearbyPlaces) : nearbyPlaces;
        if (!Array.isArray(places)) return null;
        const sea = places.find((p: any) =>
            p.name.includes('ทะเล') || p.name.includes('หาด') || p.name.toLowerCase().includes('beach')
        );
        return sea ? sea.distance : null;
    } catch (e) { return null; }
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const scoop = await getScoop(slug);
    if (!scoop) return { title: 'Not Found' };

    const title = scoop.metaTitle || scoop.title;
    const description = scoop.metaDescription || scoop.description;

    return {
        title: title,
        description: description,
        openGraph: {
            title: title,
            description: description || undefined,
            images: scoop.coverImage ? [scoop.coverImage] : [],
        },
    };
}

export default async function ScoopMagazinePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const scoop = await getScoop(slug);

    if (!scoop) return notFound();

    const queryOptions = parseRuleToPrisma(scoop.rule);

    const villas = await prisma.villa.findMany({
        ...queryOptions,
        select: {
            id: true, title: true, slug: true, coverImage: true,
            priceDaily: true, maxGuests: true, bedrooms: true,
            rating: true, reviewCount: true, province: true, district: true,
            facility_tags: true, nearbyPlaces: true, content_listing: true,
        },
    });

    const startPrice = villas.length > 0 ? Math.min(...villas.map(v => v.priceDaily)) : 0;
    const avgRating = villas.length > 0 ? (villas.reduce((a, b) => a + (b.rating || 0), 0) / villas.length).toFixed(1) : '-';
    const totalReviews = villas.reduce((sum, v) => sum + (v.reviewCount || 0), 0);

    // FAQ logic
    const faqList = (Array.isArray(scoop.faqSchema) ? scoop.faqSchema : []) as any[];
    const jsonLd = faqList.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqList.map((item: any) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.answer },
        })),
    } : null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* JSON-LD */}
            {jsonLd && (
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            )}

            {/* HERO SECTION (ดีไซน์เดิมเป๊ะ) */}
            <header className="relative h-[60vh] min-h-[500px] w-full flex items-end">
                <Image
                    src={scoop.coverImage || '/placeholder.jpg'}
                    alt={scoop.title}
                    fill
                    className="object-cover brightness-[0.6]"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90" />
                <div className="container mx-auto px-4 md:px-6 relative z-10 pb-16">
                    <nav className="flex items-center gap-2 text-sm text-white/80 mb-4 font-medium tracking-wide uppercase">
                        <Link href="/" className="hover:text-white transition">Home</Link>
                        <ChevronRight size={14} />
                        <span className="text-yellow-400">Highlights</span>
                        <ChevronRight size={14} />
                        <span className="truncate max-w-[200px]">{scoop.title}</span>
                    </nav>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight drop-shadow-2xl">
                        {scoop.title}
                    </h1>
                    <div className="flex flex-wrap gap-3">
                        <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0 py-1.5 px-4 rounded-full">
                            🏆 คัดมาแล้ว {villas.length} แห่ง
                        </Badge>
                        <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0 py-1.5 px-4 rounded-full">
                            💸 เริ่ม {startPrice.toLocaleString()} บ.
                        </Badge>
                        <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0 py-1.5 px-4 rounded-full">
                            ⭐ เรตติ้ง {avgRating}/10
                        </Badge>
                        <Badge variant="secondary" className="bg-white/10 text-white backdrop-blur-md border-0 py-1.5 px-4 rounded-full">
                            💬 รวม {totalReviews.toLocaleString()} รีวิว
                        </Badge>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 md:px-6 -mt-10 relative z-20">
                {/* EDITOR NOTE (ดีไซน์เดิม) */}
                <div className="bg-white rounded-2xl p-8 shadow-xl mb-16 border-l-4 border-yellow-400 relative overflow-hidden">
                    <Quote className="absolute top-4 right-6 text-slate-100 scale-x-[-1]" size={120} />
                    <div className="relative z-10">
                        <h2 className="text-xl font-bold text-slate-900 mb-3 flex items-center gap-2">💬 Note</h2>
                        <p className="text-slate-600 leading-relaxed text-lg">{scoop.description}</p>
                    </div>
                </div>

                {/* THE LIST (ดีไซน์เดิม: Horizontal Card) */}
                <div className="space-y-8 max-w-5xl mx-auto">
                    {villas.map((villa, index) => {
                        const seaDistance = getDistanceToSea(villa.nearbyPlaces);
                        const perPerson = Math.round(villa.priceDaily / (villa.maxGuests || 1));

                        // Tag Sorting Logic
                        let displayTags: any[] = [];
                        try {
                            const allTags = Array.isArray(villa.facility_tags)
                                ? villa.facility_tags
                                : JSON.parse(villa.facility_tags as string || '[]');

                            displayTags = allTags
                                .sort((a: any, b: any) => {
                                    const priorityA = TAG_PRIORITY.indexOf(a.id);
                                    const priorityB = TAG_PRIORITY.indexOf(b.id);
                                    const valA = priorityA !== -1 ? priorityA : 99;
                                    const valB = priorityB !== -1 ? priorityB : 99;
                                    return valA - valB;
                                })
                                .slice(0, 10);
                        } catch (e) {
                            displayTags = [];
                        }

                        const isBedroomMismatch =
                            villa.bedrooms &&
                            villa.maxGuests &&
                            (villa.maxGuests / villa.bedrooms > 6);

                        return (
                            <Card key={villa.id} className="group border-0 shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white rounded-3xl">
                                <div className="flex flex-col lg:flex-row">

                                    {/* --- ส่วนรูปภาพ (คงเดิม) --- */}
                                    <div className="w-full lg:w-[40%] h-80 lg:h-auto relative overflow-hidden">
                                        {/* ✅ เพิ่ม Link ครอบ Image ตรงนี้ ✅ */}
                                        <Link href={`/villa/${villa.slug}`} className="block w-full h-full">

                                            <Image
                                                src={villa.coverImage || '/placeholder.jpg'}
                                                alt={villa.title}
                                                fill
                                                sizes="(max-width: 768px) 100vw, 40vw"
                                                priority={index < 2}
                                                className="object-cover group-hover:scale-110 transition-transform duration-1000"
                                            />

                                            {/* Rank Badge */}
                                            <div className="absolute top-2 left-2 z-20 select-none pointer-events-none">
                                                <span className="text-[40px] font-black text-white leading-none tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] opacity-90 italic">
                                                    {index + 1}
                                                </span>
                                            </div>

                                            {/* Sea Distance Badge */}
                                            {seaDistance && (
                                                <div className="absolute bottom-2 left-2 z-20 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                                    <p className="text-[10px] font-bold text-white flex items-center gap-1 uppercase tracking-widest">
                                                        <Waves size={12} /> {seaDistance}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent opacity-60" />

                                        </Link>
                                        {/* ✅ ปิด Link ตรงนี้ ✅ */}
                                    </div>

                                    {/* --- Right Side: Info Section (คงเดิม) --- */}
                                    <div className="flex-1 p-4 lg:p-6 flex flex-col">

                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-bold uppercase tracking-[0.15em]">
                                                <MapPin size={12} className="text-red-400" />
                                                {villa.district}, {villa.province}
                                            </div>
                                            {(villa.rating ?? 0) > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                                                    <span className="text-sm font-black text-slate-800">
                                                        {villa.rating.toFixed(1)}
                                                    </span>
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                                                        ({villa.reviewCount?.toLocaleString() || 0} รีวิว)
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <h3 className="text-xl lg:text-2xl font-black text-slate-900 mb-2 leading-[1.1] group-hover:text-blue-600 transition-colors">
                                            <Link href={`/villa/${villa.slug}`}>{villa.title}</Link>
                                        </h3>

                                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4 h-[42px] overflow-hidden italic">
                                            "{villa.content_listing || "พูลวิลล่าส่วนตัวพร้อมสิ่งอำนวยความสะดวกครบครัน ในราคาคุ้มค่า..."}"
                                        </p>

                                        {/* Tags Display */}
                                        <div className="flex flex-wrap gap-x-2 gap-y-2 mb-4 min-h-[40px] content-start">
                                            {displayTags.length > 0 ? (
                                                displayTags.map((tag: any) => {
                                                    const IconComponent = (LucideIcons as any)[tag.icon] || LucideIcons.HelpCircle;
                                                    return (
                                                        <div key={tag.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 max-w-[160px] shrink-0">
                                                            <IconComponent size={12} className="shrink-0 opacity-70" />
                                                            <span className="text-[10.5px] font-semibold tracking-tight truncate leading-none">
                                                                {tag.label}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <div className="text-[11px] text-slate-400 italic flex items-center gap-2">
                                                    Full amenities included
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px bg-slate-100 w-full mb-4" />

                                        {/* Footer Info */}
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mt-auto">
                                            <div className="flex items-center gap-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">รองรับ</span>
                                                    <div className="flex items-center gap-2 font-black text-slate-700">
                                                        <Users size={18} className="text-blue-500" /> {villa.maxGuests} ท่าน
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">ห้องนอน</span>
                                                    <div className="flex items-center gap-2 font-black text-slate-700">
                                                        <BedDouble size={18} className="text-blue-500" />
                                                        {isBedroomMismatch ? "-" : `${villa.bedrooms} ห้อง`}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-5 self-end sm:self-auto">
                                                <div className="text-right">
                                                    <div className="text-[22px] font-black text-slate-900 leading-none">
                                                        {villa.priceDaily.toLocaleString()}฿
                                                    </div>
                                                    <div className="text-[12px] font-bold text-slate-500 mt-1">
                                                        (ตกคนละ {perPerson.toLocaleString()}฿)
                                                    </div>
                                                </div>
                                                <Link href={`/villa/${villa.slug}`}>
                                                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-blue-600 transition-all duration-300 shadow-xl group-hover:rotate-12">
                                                        <ChevronRight size={28} />
                                                    </div>
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>

                {/* --- 3. FAQ UI SECTION (ของใหม่ ต่อท้ายอย่างเดียว ไม่กระทบข้างบน) --- */}
                {faqList.length > 0 && (
                    <section className="max-w-5xl mx-auto bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-100 my-20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>

                        <div className="text-center mb-10 relative z-10">
                            <Badge variant="secondary" className="mb-4 bg-yellow-100 text-yellow-700 hover:bg-yellow-200">
                                <HelpCircle size={14} className="mr-1" /> Q&A
                            </Badge>
                            <h2 className="text-3xl font-black text-slate-900 mb-4">คำถามที่พบบ่อย</h2>
                            <p className="text-slate-500">ข้อมูลเพิ่มเติมที่คุณอาจสงสัยเกี่ยวกับรายการที่พักนี้</p>
                        </div>

                        <div className="grid gap-6 relative z-10">
                            {faqList.map((item: any, index: number) => (
                                <div key={index} className="group bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 rounded-xl p-6 transition-all duration-300">
                                    <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-start gap-3">
                                        <span className="bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-md">Q</span>
                                        <span className="mt-0.5">{item.question}</span>
                                    </h3>
                                    <div className="pl-10">
                                        <p className="text-slate-600 leading-relaxed bg-white/50 p-4 rounded-lg border border-slate-100">
                                            {item.answer}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

            </main>
        </div>
    );
}