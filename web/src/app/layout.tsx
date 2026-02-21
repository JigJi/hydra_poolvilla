// src/app/layout.tsx
import { Navbar } from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer'; // 👈 1. Import เข้ามาเพิ่ม
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            <body className="flex flex-col min-h-screen">
                <Navbar />

                {/* 2. ตัวเนื้อหาของแต่ละหน้า */}
                <main className="flex-grow">
                    {children}
                </main>

                <Footer /> {/* ✅ 3. วาง Footer ไว้ล่างสุดตรงนี้ */}
            </body>
        </html>
    );
}