// src/app/terms/page.tsx
import React from 'react';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white py-20">
            <div className="max-w-3xl mx-auto px-4 prose prose-slate">
                <h1 className="text-3xl font-black mb-8">ข้อกำหนดและเงื่อนไขการใช้งาน</h1>
                <p className="text-slate-600 mb-4 text-sm">อัปเดตล่าสุด: 21 กุมภาพันธ์ 2026</p>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">1. การยอมรับข้อกำหนด</h2>
                    <p className="text-slate-600">การเข้าถึงและใช้งาน PoolVillaFinder.com ถือว่าคุณยอมรับข้อกำหนดและเงื่อนไขเหล่านี้ทุกประการ</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">2. ข้อมูลบนเว็บไซต์</h2>
                    <p className="text-slate-600">เราพยายามให้ข้อมูลพูลวิลล่ามีความถูกต้องที่สุด อย่างไรก็ตาม ข้อมูล ราคา และสถานะการว่างอาจมีการเปลี่ยนแปลงตามเงื่อนไขของผู้ให้บริการที่พักต้นทาง</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-slate-900">3. ข้อจำกัดความรับผิดชอบ</h2>
                    <p className="text-slate-600">PoolVillaFinder เป็นเพียงแพลตฟอร์มรวบรวมข้อมูลและส่งต่อการจองเท่านั้น เราไม่มีส่วนรับผิดชอบต่อความเสียหายที่เกิดขึ้นระหว่างการเข้าพักหรือการทำธุรกรรมกับบุคคลที่สาม</p>
                </section>
            </div>
        </div>
    );
}