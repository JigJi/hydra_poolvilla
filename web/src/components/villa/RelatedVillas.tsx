'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, MapPin, BedDouble, Users } from 'lucide-react';

interface RelatedVillasProps {
    villas: any[];
    currentLocation?: string | null; // รองรับ null ได้
}

export default function RelatedVillas({ villas, currentLocation }: RelatedVillasProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = 320;
            if (direction === 'left') {
                current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
        }
    };

    if (!villas || villas.length === 0) return null;

    // 🛠️ Logic ปรับหัวข้อ: ถ้ามี Location ให้โชว์ชื่อเมือง ถ้าไม่มีให้ใช้คำกลางๆ
    const sectionTitle = currentLocation
        ? `ที่พักอื่นๆ ใน ${currentLocation}`
        : "ที่พักแนะนำที่คุณอาจจะชอบ";

    return (
        <div className="relative group/section">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{sectionTitle}</h2>

            {/* ปุ่ม Navigation (เหมือนเดิม) */}
            <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-[60%] -translate-y-1/2 z-10 bg-white/90 border border-slate-200 p-2 rounded-full shadow-lg text-slate-700 opacity-0 group-hover/section:opacity-100 transition-opacity disabled:opacity-0 hidden md:block hover:bg-slate-50"
            >
                <ChevronLeft size={24} />
            </button>

            <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-[60%] -translate-y-1/2 z-10 bg-white/90 border border-slate-200 p-2 rounded-full shadow-lg text-slate-700 opacity-0 group-hover/section:opacity-100 transition-opacity hidden md:block hover:bg-slate-50"
            >
                <ChevronRight size={24} />
            </button>

            {/* Container Slide */}
            <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0"
            >
                {villas.map((item) => (
                    <Link
                        href={`/villa/${item.slug}`}
                        key={item.id}
                        className="snap-center shrink-0 w-[280px] sm:w-[320px] group block bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                    >
                        {/* Image Logic */}
                        <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden">
                            <Image
                                src={item.images?.[0] || "/placeholder.jpg"}
                                alt={item.title}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                sizes="320px"
                            />
                            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm">
                                {item.priceDaily > 0 ? (
                                    <>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase mr-1">เริ่มต้น</span>
                                        <span className="text-slate-900 font-black">฿{item.priceDaily.toLocaleString()}</span>
                                    </>
                                ) : (
                                    <span className="text-xs text-blue-600 font-bold">สอบถามราคา</span>
                                )}
                            </div>
                        </div>

                        <div className="p-4">
                            <h3 className="font-bold text-slate-900 text-base line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                                {item.title}
                            </h3>

                            <div className="flex items-center gap-3 text-slate-500 text-xs mb-3">
                                {/* ห้องนอน: โชว์เมื่อ > 0 */}
                                {item.bedrooms > 0 && (
                                    <div className="flex items-center gap-1">
                                        <BedDouble size={14} />
                                        <span>{item.bedrooms} นอน</span>
                                    </div>
                                )}
                                {/* จำนวนคน: โชว์เมื่อ > 0 */}
                                {item.maxGuests > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Users size={14} />
                                        <span>{item.maxGuests} คน</span>
                                    </div>
                                )}

                                {/* 🛠️ Location Fix: ถ้าไม่มี Location ไม่ต้องโชว์หมุดให้รก */}
                                {(item.location || currentLocation) && (
                                    <div className="flex items-center gap-1 ml-auto text-slate-400">
                                        <MapPin size={12} />
                                        <span className="truncate max-w-[80px]">
                                            {item.location || currentLocation}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="w-full py-2 text-center rounded-lg bg-slate-50 text-slate-600 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-all">
                                ดูรายละเอียด
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}