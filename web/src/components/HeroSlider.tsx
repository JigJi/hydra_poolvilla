// src/components/HeroSlider.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image'; // ✅ 1. เพิ่มบรรทัดนี้
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from 'next/link'; // เผื่อใช้ Link ครอบปุ่ม

interface ScoopProps {
    id: number | string;
    title: string;
    imageUrl: string;
    slug?: string; // เพิ่ม slug เผื่อไว้ link ไปหน้าอ่านต่อ
}

export default function HeroSlider({ scoops }: { scoops: ScoopProps[] }) {
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        // ถ้ามี scoop เดียวไม่ต้อง set interval
        if (scoops.length <= 1) return;

        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % scoops.length);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, [scoops.length]);

    return (
        <section className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl bg-slate-900 shadow-sm border border-slate-200">
            {scoops.map((scoop, index) => (
                <div
                    key={scoop.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                        }`}
                >
                    {/* ✅ 2. เปลี่ยน <img> เป็น <Image /> ตรงนี้ */}
                    <Image
                        src={scoop.imageUrl}
                        alt={scoop.title}
                        fill // แทน className="w-full h-full"
                        className="object-cover" // ตัดขอบภาพให้พอดี
                        priority={index === 0} // รูปแรกโหลดด่วน รูปอื่นรอได้
                        sizes="100vw" // 👈 คีย์เวิร์ดแก้ภาพแตก: บอกว่ารูปนี้กว้างเต็มจอ
                        quality={90} // 👈 คีย์เวิร์ดแก้ภาพแตก: ขอชัดๆ 90%
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-12">
                        <div className="text-white max-w-3xl space-y-4">
                            <Badge variant="secondary" className="text-xs uppercase tracking-widest px-3 py-1 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-md">
                                Featured Scoop
                            </Badge>

                            <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight drop-shadow-md line-clamp-2">
                                {scoop.title}
                            </h2>

                            {/* ปุ่มอ่านต่อ (Optional: ใส่ Link ถ้ามี slug) */}
                            {scoop.slug ? (
                                <Link href={`/scoop/${scoop.slug}`}>
                                    <Button variant="default" size="lg" className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white border-none shadow-lg shadow-blue-900/20">
                                        อ่านต่อ
                                    </Button>
                                </Link>
                            ) : (
                                <Button variant="default" size="lg" className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white border-none">
                                    อ่านต่อ
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Dots Indicator */}
            {scoops.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {scoops.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 transition-all duration-300 rounded-full shadow-sm ${index === currentSlide ? 'bg-blue-500 w-8' : 'bg-white/50 w-4 hover:bg-white'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}