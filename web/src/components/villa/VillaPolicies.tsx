"use client"; // 🚀 ต้องเพิ่มบรรทัดนี้เพื่อใช้ useState

import React, { useState } from 'react';
import {
    ClipboardList, LogIn, LogOut, PawPrint,
    Coins, VolumeX, Baby, UserX, ChevronDown, ChevronUp
} from 'lucide-react';

interface VillaPoliciesProps {
    policies: any;
}

// --- Component ย่อยสำหรับจัดการข้อความยาวๆ ---
const ExpandableText = ({ text, limit = 160 }: { text: string, limit?: number }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    // ถ้าข้อความสั้นกว่าที่กำหนด ไม่ต้องมีปุ่ม "อ่านต่อ"
    if (text.length <= limit) return <span className="text-slate-600 text-sm leading-relaxed">{text}</span>;

    return (
        <div className="space-y-1">
            <span className={`text-slate-600 text-sm leading-relaxed transition-all ${!isExpanded ? 'line-clamp-3' : ''}`}>
                {text}
            </span>
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 text-xs font-bold flex items-center gap-0.5 hover:text-blue-700 mt-1"
            >
                {isExpanded ? (
                    <>แสดงน้อยลง <ChevronUp size={14} /></>
                ) : (
                    <>อ่านต่อ <ChevronDown size={14} /></>
                )}
            </button>
        </div>
    );
};

const VillaPolicies = ({ policies: rawPolicies }: VillaPoliciesProps) => {
    let policies: any[] = [];
    try {
        if (typeof rawPolicies === 'string') policies = JSON.parse(rawPolicies);
        else if (Array.isArray(rawPolicies)) policies = rawPolicies;
    } catch (e) { policies = []; }

    const findPolicy = (keywords: string[]) =>
        policies.find((p: any) => keywords.some(k => p.topic.includes(k)));

    const extractTime = (text: string) =>
        text ? (text.match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/)?.[0] || "-") : "-";

    const checkIn = findPolicy(['เช็คอิน']);
    const checkOut = findPolicy(['เช็คเอาท์']);

    let checkOutTime = "11:00";
    if (checkOut?.content) {
        const times = checkOut.content.match(/([01]?[0-9]|2[0-3]):[0-5][0-9]/g);
        if (times && times.length > 1) checkOutTime = times[1];
        else if (times && times.length === 1) checkOutTime = times[0];
    }

    if (policies.length === 0) return null;

    return (
        <div className="space-y-6 h-full">
            <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ClipboardList size={24} className="text-blue-600" />
                กฎระเบียบและข้อตกลง
            </h3>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-sm h-full">
                {/* Time Slot Card */}
                <div className="flex flex-col sm:flex-row items-center justify-between mb-8 bg-white p-5 rounded-xl border border-slate-200">
                    <div className="text-center w-full sm:w-1/2 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <LogIn size={16} className="text-slate-400" />
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
                            <LogOut size={16} className="text-slate-400" />
                        </div>
                        <div className="text-3xl font-black text-slate-900">
                            {checkOutTime}
                        </div>
                    </div>
                </div>

                {/* Policies List */}
                <ul className="space-y-6">
                    {/* ตัวอย่างการใช้ ExpandableText กับหัวข้อที่มีเนื้อหาเยอะ */}
                    {[
                        { key: ['สัตว์เลี้ยง'], icon: PawPrint, color: 'text-green-600', bg: 'bg-green-50 border-green-100', title: 'สัตว์เลี้ยง' },
                        { key: ['เงินประกัน', 'มัดจำ', 'ความเสียหาย'], icon: Coins, color: 'text-orange-500', bg: 'bg-white border-slate-200' },
                        { key: ['ปาร์ตี้', 'เสียงดัง', 'งานเลี้ยง'], icon: VolumeX, color: 'text-red-500', bg: 'bg-white border-slate-200' },
                        { key: ['เด็ก', 'เตียงเสริม'], icon: Baby, color: 'text-blue-500', bg: 'bg-white border-slate-200', title: 'เด็กและเตียงเสริม' },
                        { key: ['ข้อจำกัดด้านอายุ', 'อายุ'], icon: UserX, color: 'text-slate-500', bg: 'bg-white border-slate-200' }
                    ].map((item, idx) => {
                        const policy = findPolicy(item.key);
                        if (!policy || (item.key.includes('อายุ') && policy.content.includes('ไม่จำกัด'))) return null;

                        const Icon = item.icon;
                        return (
                            <li key={idx} className="flex gap-4 items-start">
                                <div className={`p-2.5 rounded-full border shrink-0 shadow-sm ${item.bg} ${item.color}`}>
                                    <Icon size={20} />
                                </div>
                                <div className="flex-1">
                                    <span className="font-bold text-slate-900 block text-sm mb-1">
                                        {item.title || policy.topic}
                                    </span>
                                    {/* 🚀 ใช้ ExpandableText แทนข้อความดิบๆ */}
                                    <ExpandableText text={policy.content} />
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default VillaPolicies;