// src/app/layout.tsx
import { Navbar } from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import './globals.css';
import { Metadata } from 'next'; // 👈 เพิ่มการ Import Type

// ✅ เพิ่ม Metadata ตรงนี้ (มันจะไปคุมทุกหน้าของเว็บ)
export const metadata: Metadata = {
    title: 'PoolVillaFinder | ค้นหาพูลวิลล่าที่ดีที่สุดทั่วไทย',
    description: 'จองพูลวิลล่าราคาถูก พัทยา หัวหิน เชียงใหม่ ภูเก็ต พร้อมบทความแนะนำที่เที่ยว',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
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