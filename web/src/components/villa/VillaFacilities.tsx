'use client';

import { useState, useEffect } from 'react';
import { getFacilityIcon } from '@/utils/facilityIcons'; // ตรวจสอบ path ให้ตรงกับไฟล์ utils ที่สร้าง
import { Plus, CheckCircle2, X } from 'lucide-react';

export default function VillaFacilities({ data }: { data: any }) {
    const [isOpen, setIsOpen] = useState(false);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    // Fallback Logic
    let highlights = data?.popular || [];
    if (highlights.length === 0 && data?.categories) {
        highlights = data.categories.flatMap((c: any) => c.items).slice(0, 8);
    } else {
        highlights = highlights.slice(0, 8);
    }

    const totalCount = data?.categories?.reduce((acc: number, cat: any) => acc + cat.items.length, 0) || 0;

    if (highlights.length === 0) return null;

    return (
        <>
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-100 mt-8">
                <h3 className="text-lg font-bold mb-4 text-slate-900">สิ่งอำนวยความสะดวก</h3>

                {/* Grid Layout */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {highlights.map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-3">
                            <span className="text-blue-600 bg-white p-2 rounded-lg shadow-sm border border-slate-100">
                                {getFacilityIcon(item)}
                            </span>
                            <span className="text-sm text-slate-700 font-medium truncate">
                                {item}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Show All Button */}
                {totalCount > 8 && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 border border-slate-300 bg-white rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
                    >
                        <Plus size={16} />
                        ดูสิ่งอำนวยความสะดวกทั้งหมด ({totalCount})
                    </button>
                )}
            </div>

            {/* --- Custom Modal Overlay (No UI Library required) --- */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">

                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h2 className="text-xl font-bold text-slate-900">สิ่งอำนวยความสะดวกทั้งหมด</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-slate-600" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="overflow-y-auto p-6">
                            <div className="space-y-8">
                                {data?.categories?.map((cat: any, idx: number) => (
                                    <div key={idx}>
                                        <h4 className="font-bold text-lg text-slate-900 mb-4 flex items-center gap-2">
                                            {cat.name}
                                            <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                                {cat.items.length}
                                            </span>
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4">
                                            {cat.items.map((item: string, i: number) => (
                                                <div key={i} className="flex items-start gap-3 text-slate-600 text-sm group hover:text-slate-900 transition-colors">
                                                    <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                                                    <span className="leading-snug">{item}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {idx !== data.categories.length - 1 && <hr className="my-6 border-slate-100 border-dashed" />}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50 text-center sm:text-right">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-6 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-sm"
                            >
                                ปิดหน้าต่าง
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}