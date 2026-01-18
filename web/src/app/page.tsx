'use client';

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';

export default function LandingPage() {
    // 1. ข้อมูล Featured Scoops 5 อันสำหรับ Slider ด้านบน
    const featuredScoops = [
        {
            id: 1,
            title: "10 พูลวิลล่าหัวหินเปิดใหม่ 2026 พร้อมสระส่วนตัวและเตาหมูกระทะ",
            imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070",
            link: "#",
        },
        {
            id: 2,
            title: "รวม 5 ที่พักปราณบุรีวิวทะเล สไตล์มินิมอล ถ่ายรูปสวยลงตัว",
            imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=2070",
            link: "#",
        },
        {
            id: 3,
            title: "ปาร์ตี้วิลล่าพัทยา เสียงดังได้ไม่โดนบ่น พื้นที่กว้างราคาประหยัด",
            imageUrl: "https://images.unsplash.com/photo-1570710891163-f27c7f4741e0?q=80&w=2070",
            link: "#",
        },
        {
            id: 4,
            title: "หนีร้อนไปพึ่งเย็น! 7 ที่พักเขาใหญ่ มีอ่างน้ำส่วนตัวแช่ฟินๆ",
            imageUrl: "https://images.unsplash.com/photo-1582268611958-abcf3ad93f6c?q=80&w=2070",
            link: "#",
        },
        {
            id: 5,
            title: "กรุงเทพฯ ก็มีพูลวิลล่าหรู! ใจกลางเมือง เดินทางสะดวกสไตล์ Staycation",
            imageUrl: "https://images.unsplash.com/photo-1502672260266-cb255d648f38?q=80&w=2070",
            link: "#",
        },
    ];

    // 2. ข้อมูลกลุ่ม Scoop ด้านล่าง 3 กลุ่ม กลุ่มละ 10 อัน
    const scoopGroups = [
        {
            title: 'วิลล่าฮิตตามอำเภอ',
            items: [
                "10 พูลวิลล่าหัวหิน ราคาหลักพันแต่ความสวยหลักล้าน",
                "รวมที่พักปราณบุรี สงบ เงียบ เหมาะกับครอบครัว",
                "พัทยาไปกี่ทีก็ไม่เบื่อ! 7 วิลล่าใกล้ Walking Street",
                "เขาใหญ่สไตล์ยุโรป 8 วิลล่าถ่ายรูปสวยเหมือนอยู่เมืองนอก",
                "เช็คอินชะอำ! 5 พูลวิลล่าเปิดใหม่ เดินลงหาดได้เลย",
                "มวกเหล็กก็มีดี! ที่พักริมน้ำ บรรยากาศสุดชิล",
                "พิกัดลับสวนผึ้ง! วิลล่าสไตล์ฟาร์มเฮาส์ น่ารักสุดๆ",
                "แม่กำปองต้องลอง! บ้านพักกลางหุบเขา อากาศดีทั้งปี",
                "หาดเจ้าสำราญ... แต่ใจไม่สำราญถ้าไม่ได้พัก 5 วิลล่านี้",
                "กาญจนบุรีนอนแพมันเชย! มานอนพูลวิลล่าวิวเขื่อนกัน"
            ]
        },
        {
            title: 'วิลล่าติดทะเล',
            items: [
                "ตื่นมาเจอเล! 5 วิลล่าหน้าหาด ทะเลอยู่แค่เอื้อม",
                "Pool Villa เกาะล้าน... น้ำใสแจ๋ว ข้ามฝั่งมานิดเดียว",
                "รวมวิลล่าหรูภูเก็ต วิว Sunset ที่สวยที่สุดในชีวิต",
                "กระบี่ดีต่อใจ! 7 ที่พักพูลวิลล่ากลางทะเลอันดามัน",
                "สมุยมันรัก! วิลล่าบนเขาเห็นวิวนางยวนแบบพาโนรามา",
                "พัทยาเหนือ vs พัทยาใต้... รวมวิลล่าติดหาดทั้งสองโซน",
                "ที่พักระยอง... ติดทะเล ราคาประหยัด ปิ้งย่างได้เต็มที่",
                "เกาะกูดมันกู๊ดมาก! วิลล่าสไตล์ทรอปิคอลสุดส่วนตัว",
                "หัวหินซอย 51... รวมที่พักติดเล เดินไปคาเฟ่สะดวก",
                "บางแสนก็มีพูลวิลล่า! 5 ที่พักใหม่ ใกล้เขาสามมุข"
            ]
        },
        {
            title: 'วิลล่าใกล้ชิดธรรมชาติ',
            items: [
                "นอนดูดาว! 10 วิลล่าเขาใหญ่ ท่ามกลางป่าสน",
                "พูลวิลล่ากลางสวนทุเรียน! สัมผัสวิถีชาวสวน จันทบุรี",
                "เชียงใหม่ในม่านหมอก... ที่พักพูลวิลล่าบนดอยอินทนนท์",
                "นอนนิ่งๆ ฟังเสียงน้ำไหล... รวมที่พักริมลำธาร นครนายก",
                "วิลล่าไม้สไตล์บาหลี ท่ามกลางป่าดิบชื้น พังงา",
                "สูดโอโซนให้เต็มปอด! ที่พักวังน้ำเขียว วิวสวิสเมืองไทย",
                "ราชบุรีมีมากกว่าโอ่ง! รวมวิลล่ากลางป่าไผ่สุดกรีน",
                "พูลวิลล่ากลางนาข้าว... สัมผัสกลิ่นอายลูกทุ่ง แพร่",
                "เขาค้อ... ไม่ต้องรอหน้าหนาว รวมที่พักวิวทะเลหมอก",
                "แม่ริมที่รัก! 5 วิลล่ามีสระว่ายน้ำ เห็นวิวนาขั้นบันได"
            ]
        }
    ];

    // 3. Logic สำหรับ Auto Slider
    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const slideInterval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % featuredScoops.length);
        }, 5000);
        return () => clearInterval(slideInterval);
    }, [featuredScoops.length]);

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">

            {/* SECTION 1: STICKY HEADER */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-4 h-[65px] flex items-center justify-between">
                    <h1 className="text-xl font-black tracking-tight text-blue-600">PoolVillaFinder</h1>
                    <div className="hidden md:block flex-1"></div>
                    <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                        <Search size={22} className="text-slate-600" />
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-12">

                {/* SECTION 2: AUTO SLIDER (5 SCOOPS) */}
                <section className="relative w-full aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                    {featuredScoops.map((scoop, index) => (
                        <div
                            key={scoop.id}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <img src={scoop.imageUrl} className="w-full h-full object-cover" alt={scoop.title} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6 md:p-12">
                                <div className="text-white max-w-3xl space-y-3">
                                    <span className="bg-blue-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest inline-block">Featured Scoop</span>
                                    <h2 className="text-2xl md:text-5xl font-bold leading-tight">{scoop.title}</h2>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Slider Indicators (5 Dots) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                        {featuredScoops.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 transition-all duration-300 rounded-full ${index === currentSlide ? 'bg-blue-500 w-8' : 'bg-white/40 w-4'}`}
                            />
                        ))}
                    </div>
                </section>

                {/* SECTION 3: SCOOP GROUPS (กลุ่มละ 10 รายการ) */}
                {scoopGroups.map((group) => (
                    <section key={group.title} className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-bold tracking-tight">{group.title}</h3>
                            <button className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline">
                                ดูทั้งหมด <ChevronRight size={16} />
                            </button>
                        </div>

                        <div className="flex gap-5 overflow-x-auto pb-6 no-scrollbar snap-x">
                            {group.items.map((title, index) => (
                                <div key={index} className="flex-none w-[280px] space-y-3 group cursor-pointer snap-start">
                                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-slate-50 border border-slate-100 relative">
                                        <img
                                            src={`https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&sig=${group.title}${index}`}
                                            className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                                            alt={title}
                                        />
                                        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-slate-800 shadow-sm border border-slate-100">
                                            NEW
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-base leading-snug group-hover:text-blue-600 transition line-clamp-2">
                                        {title}
                                    </h4>
                                </div>
                            ))}
                        </div>
                    </section>
                ))}

            </main>

            {/* SECTION 4: SIMPLE FOOTER */}
            <footer className="py-12 border-t border-slate-100 mt-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-slate-400 text-sm font-medium">© 2026 PoolVillaFinder. All rights reserved.</p>
                </div>
            </footer>

            {/* CSS สำหรับซ่อน Scrollbar แต่ยังเลื่อนได้ */}
            <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    );
}