// src/components/villa/VillaBookingCard.tsx
import React from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';

interface VillaBookingCardProps {
    villa: {
        priceDaily: number;
        sourceUrl?: string | null;
        maxGuests?: number | null;
    };
    perPerson: number;
}

const VillaBookingCard = ({ villa, perPerson }: VillaBookingCardProps) => {
    // คำนวณราคาเต็ม (หลอกๆ) สำหรับแสดงส่วนลด
    const fakeOriginalPrice = Math.round(villa.priceDaily * 1.3);

    return (
        <div className="md:col-span-1 sticky top-24 z-20">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg shadow-slate-200/50 overflow-hidden">
                <div className="p-5 space-y-4">
                    {/* ส่วนแสดงราคา */}
                    <div>
                        <div className="text-slate-400 text-xs line-through font-medium">
                            ฿{fakeOriginalPrice.toLocaleString()}
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                                ฿{villa.priceDaily.toLocaleString()}
                            </span>
                            <span className="text-sm font-bold text-slate-500">/ คืน</span>
                        </div>
                    </div>

                    {/* กล่องราคาเฉลี่ยต่อคน */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg py-2 px-3 text-center">
                        <span className="text-lg text-slate-600 font-medium">
                            ตกคนละ <span className="text-blue-600 font-bold">฿{perPerson.toLocaleString()}</span>
                        </span>
                    </div>

                    {/* ปุ่ม CTA สำหรับจอง */}
                    <a
                        href={villa.sourceUrl || "#"}
                        target="_blank"
                        rel="nofollow noopener noreferrer"
                        className="group w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-base font-bold py-3 rounded-xl shadow-md transition-all transform active:scale-[0.98]"
                    >
                        เช็คราคา & จอง <ArrowUpRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </a>

                    {/* ข้อความสร้างความมั่นใจ */}
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-medium">
                        <ShieldCheck size={14} className="text-green-500" />
                        <span>จองตรงปลอดภัย 100%</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VillaBookingCard;