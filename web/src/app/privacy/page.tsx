// src/app/privacy/page.tsx
import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-3xl mx-auto px-4 prose prose-slate">
                <h1 className="text-3xl font-black mb-8">นโยบายความเป็นส่วนตัว</h1>
                <p className="text-slate-600 mb-4 text-sm">อัปเดตล่าสุด: 21 กุมภาพันธ์ 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">1. การเก็บรวบรวมข้อมูล</h2>
                    <p className="text-slate-600">เราเก็บข้อมูลคุกกี้ (Cookies) เพื่อวิเคราะห์สถิติการใช้งานเว็บไซต์ผ่าน Google Analytics เพื่อปรับปรุงประสบการณ์การใช้งานของคุณให้ดียิ่งขึ้น</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">2. การรักษาความปลอดภัย</h2>
                    <p className="text-slate-600">เราไม่มีการเก็บข้อมูลบัตรเครดิตหรือรหัสผ่านใดๆ ของผู้ใช้บนเซิร์ฟเวอร์ของเรา ข้อมูลการจองทั้งหมดจะถูกส่งต่อไปยังแพลตฟอร์มมาตรฐานสากลที่มีความปลอดภัยสูง</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">3. สิทธิตามกฎหมาย PDPA</h2>
                    <p className="text-slate-600">คุณมีสิทธิในการเข้าถึง ขอสำเนา หรือขอให้ลบข้อมูลส่วนบุคคลที่เราเก็บรวบรวมไว้ โดยสามารถติดต่อเราได้ทางอีเมล support@poolvillafinder.com</p>
                </section>
            </div>
        </div>
    );
}