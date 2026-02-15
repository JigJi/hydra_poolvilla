/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'; // สำคัญ! ต้องมีบรรทัดนี้เพราะมีการใช้ useState

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface VillaGalleryProps {
    images: string[];
    title: string;
}

export default function VillaGallery({ images, title }: VillaGalleryProps) {
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [photoIndex, setPhotoIndex] = useState(0);

    const openGallery = (index: number) => {
        setPhotoIndex(index);
        setIsGalleryOpen(true);
        document.body.style.overflow = 'hidden'; // ล็อก Scroll
    };

    const closeGallery = useCallback(() => {
        setIsGalleryOpen(false);
        document.body.style.overflow = 'unset'; // ปลดล็อก
    }, []);

    const nextPhoto = useCallback((e?: any) => {
        e?.stopPropagation();
        setPhotoIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const prevPhoto = useCallback((e?: any) => {
        e?.stopPropagation();
        setPhotoIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }, [images.length]);

    // Keyboard Navigation
    useEffect(() => {
        if (!isGalleryOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeGallery();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isGalleryOpen, nextPhoto, prevPhoto, closeGallery]);

    // ถ้าไม่มีรูปเลย ให้ return null หรือ placeholder
    if (!images || images.length === 0) return null;

    return (
        <>
            {/* --- HERO GALLERY GRID --- */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 h-[300px] md:h-[450px] rounded-2xl overflow-hidden mb-8 shadow-sm select-none">

                {/* 1. รูปใหญ่ซ้าย (Index 0) */}
                <div onClick={() => openGallery(0)} className="md:col-span-2 relative h-full bg-slate-100 group cursor-pointer overflow-hidden">
                    <Image
                        src={images[0]}
                        alt={`View of ${title}`}
                        fill
                        priority
                        className="object-cover transition duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
                </div>

                {/* 2. คอลัมน์กลาง (Index 1, 2) */}
                <div className="hidden md:grid grid-rows-2 gap-2 md:col-span-1 h-full">
                    {images[1] && (
                        <div onClick={() => openGallery(1)} className="bg-slate-100 relative group overflow-hidden cursor-pointer">
                            <Image src={images[1]} alt="Gallery 2" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="25vw" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
                        </div>
                    )}
                    {images[2] && (
                        <div onClick={() => openGallery(2)} className="bg-slate-100 relative group overflow-hidden cursor-pointer">
                            <Image src={images[2]} alt="Gallery 3" fill className="object-cover transition duration-700 group-hover:scale-105" sizes="25vw" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition duration-300" />
                        </div>
                    )}
                </div>

                {/* 3. รูปขวาสุด (Index 3 + View All) */}
                {images[3] && (
                    <div onClick={() => openGallery(3)} className="hidden md:block relative bg-slate-100 md:col-span-1 overflow-hidden group cursor-pointer">
                        <Image src={images[3]} alt="Gallery 4" fill className="object-cover opacity-90 transition duration-700 group-hover:scale-105" sizes="25vw" />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition duration-300" />

                        {/* View All Button */}
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="text-white font-bold border border-white/80 bg-black/20 px-5 py-2.5 rounded-xl backdrop-blur-md hover:bg-white hover:text-slate-900 hover:border-white transition-all transform hover:scale-105 shadow-lg">
                                ดูรูปทั้งหมด ({images.length})
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* --- LIGHTBOX MODAL --- */}
            {isGalleryOpen && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <button onClick={closeGallery} className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition">
                        <X size={32} />
                    </button>

                    <div className="relative w-full h-full max-w-7xl max-h-screen p-4 flex items-center justify-center">
                        <div className="relative w-full h-full">
                            <Image
                                src={images[photoIndex]}
                                alt={`Gallery image ${photoIndex + 1}`}
                                fill
                                className="object-contain"
                                priority
                                quality={100}
                            />
                        </div>

                        <button onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full hover:bg-white hover:text-black transition backdrop-blur-sm">
                            <ChevronLeft size={32} />
                        </button>

                        <button onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 text-white rounded-full hover:bg-white hover:text-black transition backdrop-blur-sm">
                            <ChevronRight size={32} />
                        </button>

                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-md border border-white/10">
                            {photoIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}