// src/components/villa/VillaFAQ.tsx
import React from 'react';
import { HelpCircle, ChevronDown, Utensils, Coffee, Music, Car, Wifi, Flame } from 'lucide-react';

interface VillaFAQProps {
    facilities: any;
}

const VillaFAQ = ({ facilities }: VillaFAQProps) => {
    // 🛠️ 1. Logic การรวบรวมข้อมูลสิ่งอำนวยความสะดวกทั้งหมดมาไว้ที่เดียว
    let allFacilities: string[] = [];

    if (facilities?.popular) {
        allFacilities = [...allFacilities, ...facilities.popular];
    }

    if (facilities?.categories) {
        facilities.categories.forEach((cat: any) => {
            if (Array.isArray(cat.items)) {
                allFacilities = [...allFacilities, ...cat.items];
            }
        });
    }

    if (Array.isArray(facilities)) {
        allFacilities = [...allFacilities, ...facilities];
    }

    // Helper สำหรับค้นหา Keyword
    const hasItem = (keywords: string[]) =>
        allFacilities.some((f: string) =>
            keywords.some(k => f.toLowerCase().includes(k.toLowerCase()))
        );

    // 🛠️ 2. สร้างรายการคำถาม-คำตอบอัตโนมัติ
    const faqItems = [];

    // อาหารเช้า
    const hasBreakfast = hasItem(['อาหารเช้า', 'Breakfast']);
    faqItems.push({
        question: "มีอาหารเช้าให้บริการไหม?",
        icon: <Coffee size={18} className="text-orange-500" />,
        answer: hasBreakfast
            ? "ใช่ครับ มีบริการอาหารเช้าสำหรับผู้เข้าพักในรายการนี้"
            : "ราคาที่พักนี้เป็นแบบบ้านพักส่วนตัว ไม่รวมอาหารเช้าครับ แต่เรามีห้องครัวพร้อมอุปกรณ์ครบชุดให้คุณจัดเตรียมอาหารเองได้ตามใจชอบเลยครับ"
    });

    // ปิ้งย่าง (BBQ)
    const hasBBQ = hasItem(['เตา', 'ปิ้งย่าง', 'BBQ', 'Grill']);
    if (hasBBQ) {
        faqItems.push({
            question: "สามารถทำปิ้งย่าง BBQ ได้ไหม?",
            icon: <Flame size={18} className="text-red-500" />,
            answer: "ทำได้แน่นอนครับ! บ้านพักมีเตาปิ้งย่างและอุปกรณ์เตรียมไว้ให้พร้อม คุณสามารถซื้อของสดมาจัดปาร์ตี้ริมสระได้เลย"
        });
    }

    // คาราโอเกะ
    const hasKaraoke = hasItem(['คาราโอเกะ', 'Karaoke', 'ร้องเพลง']);
    if (hasKaraoke) {
        faqItems.push({
            question: "มีเครื่องเสียงหรือคาราโอเกะไหม?",
            icon: <Music size={18} className="text-purple-500" />,
            answer: "มีครับ! เราจัดเตรียมชุดคาราโอเกะพร้อมไมโครเวฟและเครื่องเสียงไว้ให้คุณสนุกสนานกับกลุ่มเพื่อนและครอบครัว"
        });
    }

    // อุปกรณ์ครัว
    const kitchenKeywords = ['ครัว', 'ตู้เย็น', 'ไมโครเวฟ', 'กระทะ', 'หม้อ', 'จาน', 'ชาม'];
    const kitchenGear = Array.from(new Set(allFacilities.filter((f: string) =>
        kitchenKeywords.some(k => f.toLowerCase().includes(k))
    )));

    if (kitchenGear.length > 0) {
        faqItems.push({
            question: "ในครัวมีอุปกรณ์อะไรให้บ้าง?",
            icon: <Utensils size={18} className="text-emerald-500" />,
            answer: `อุปกรณ์ครัวครบครันครับ มีทั้ง ${kitchenGear.slice(0, 5).join(', ')} และอื่นๆ อีกมากมาย ให้คุณทำอาหารได้เหมือนอยู่ที่บ้านเลย`
        });
    }

    // ที่จอดรถ
    const parking = allFacilities.find((f: string) => f.includes('จอดรถ'));
    if (parking) {
        faqItems.push({
            question: "จอดรถได้กี่คัน?",
            icon: <Car size={18} className="text-blue-500" />,
            answer: `สะดวกสบายเรื่องที่จอดรถครับ ${parking} โดยพื้นที่จอดรถมีความปลอดภัยแน่นอนครับ`
        });
    }

    // Wi-Fi
    const wifi = hasItem(['wifi', 'อินเทอร์เน็ต', 'เน็ต']);
    if (wifi) {
        faqItems.push({
            question: "มีอินเทอร์เน็ต Wi-Fi ไหม?",
            icon: <Wifi size={18} className="text-sky-500" />,
            answer: "มีบริการ Free Wi-Fi ความเร็วสูงให้ใช้งานตลอดการเข้าพักครับ"
        });
    }

    if (faqItems.length === 0) return null;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <HelpCircle size={24} className="text-blue-600" />
                คำถามที่พบบ่อย
            </h3>

            <div className="space-y-4">
                {faqItems.map((item, index) => (
                    <div
                        key={index}
                        className="group bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all duration-200"
                    >
                        <details className="group p-4 [&_summary::-webkit-details-marker]:hidden">
                            <summary className="flex cursor-pointer items-center justify-between gap-1.5 text-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-blue-50 transition">
                                        {item.icon}
                                    </div>
                                    <h4 className="font-bold text-base">{item.question}</h4>
                                </div>
                                <div className="text-slate-500 group-open:text-blue-600 transition">
                                    <ChevronDown size={20} className="group-open:rotate-180 transition-transform" />
                                </div>
                            </summary>
                            <div className="mt-4 leading-relaxed text-slate-600 text-sm border-t border-slate-100 pt-4 pl-12">
                                {item.answer}
                            </div>
                        </details>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VillaFAQ;