// src/app/layout.tsx
import { Navbar } from '@/components/layout/Navbar'; // Import เข้ามา
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="th">
            <body>
                <Navbar /> {/* ✅ วางไว้ตรงนี้ ทีเดียวจบ */}
                {children}
            </body>
        </html>
    );
}