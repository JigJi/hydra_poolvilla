// src/app/layout.tsx
import { Navbar } from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'PoolVillaFinder | ค้นหาพูลวิลล่าที่ดีที่สุดทั่วไทย',
    description: 'จองพูลวิลล่าราคาถูก พัทยา หัวหิน เชียงใหม่ ภูเก็ต พร้อมบทความแนะนำที่เที่ยว',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            {/* 🚀 เพิ่มส่วนนี้ลงไปครับ */}
            <head>
                <meta name="referrer" content="no-referrer" />
            </head>

            <body className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-grow">
                    {children}
                </main>
                <Footer />
            </body>
        </html>
    );
}