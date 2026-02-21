// src/components/villa/NearbyPlaces.tsx
import React from 'react';
import { MapPin, Palmtree, Plane, Utensils, ExternalLink } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface NearbyPlacesProps {
    villa: {
        latitude?: number | null;
        longitude?: number | null;
        nearbyPlaces: any;
    };
}

const NearbyPlaces = ({ villa }: NearbyPlacesProps) => {
    // 1. Parsing Data
    const places = typeof villa.nearbyPlaces === 'string'
        ? JSON.parse(villa.nearbyPlaces)
        : (villa.nearbyPlaces || []);

    // 2. Helper: เลือก Icon
    const getPlaceIcon = (cat: string) => {
        if (cat.includes('ชายหาด')) return <Palmtree size={18} className="text-orange-500" />;
        if (cat.includes('สนามบิน') || cat.includes('ท่าเรือ')) return <Plane size={18} className="text-blue-500" />;
        if (cat.includes('ร้านอาหาร') || cat.includes('คาเฟ่')) return <Utensils size={18} className="text-green-500" />;
        return <MapPin size={18} className="text-slate-400" />;
    };

    // 3. Grouping
    const highlights = places.filter((p: any) =>
        p.category.includes('ชายหาด') || p.category.includes('สนามบิน')
    );
    const others = places.filter((p: any) =>
        !p.category.includes('ชายหาด') && !p.category.includes('สนามบิน')
    ).slice(0, 5);

    // พิกัด (Fallback ไปพัทยาถ้าไม่มีข้อมูล)
    const lat = villa.latitude ?? 12.9236;
    const lng = villa.longitude ?? 100.8825;

    return (
        <div className="mt-12 md:mt-16">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2 mb-6">
                <MapPin size={24} className="text-blue-600" />
                ทำเลที่ตั้ง & สถานที่ยอดนิยม
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
                {/* ฝั่งซ้าย: Google Maps (Free Version - No API Key Required) */}
                <div className="space-y-4 h-full">
                    <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                        <iframe
                            className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
                            // ✅ แก้ไข URL เป็นแบบไม่ต้องใช้ API Key และแก้พิกัดให้ถูกต้อง
                            src={`https://maps.google.com/maps?q=${lat},${lng}&hl=th&z=15&output=embed`}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Villa Location"
                        ></iframe>
                        <a
                            // ✅ แก้ไขลิงก์ไปยัง Google Maps หน้าเต็ม
                            href={`https://www.google.com/maps?q=${lat},${lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold text-slate-700 shadow-sm hover:bg-white transition flex items-center gap-2"
                        >
                            <ExternalLink size={16} /> ดูบน Google Maps
                        </a>
                    </div>
                </div>

                {/* ฝั่งขวา: รายชื่อสถานที่ใกล้เคียง */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-fit">
                    <div className="space-y-6">
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

                        {highlights.length > 0 && others.length > 0 && <Separator className="bg-slate-200" />}

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
                </div>
            </div>
        </div>
    );
};

export default NearbyPlaces;