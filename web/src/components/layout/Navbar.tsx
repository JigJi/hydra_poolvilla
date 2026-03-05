// components/layout/Navbar.tsx
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 h-[65px] flex items-center justify-between gap-4">

                {/* 1. LOGO */}
                <Link href="/" className="shrink-0">
                    <span className="text-xl font-black tracking-tight text-blue-600 cursor-pointer">
                        PoolVillaFinder
                    </span>
                </Link>

                {/* 2. 🚀 SEARCH BAR (Desktop & Tablet) */}
                <div className="flex-1 max-w-lg hidden sm:block">
                    {/* ใช้ action="/search" จะส่งค่าไปที่ /search?q=คำค้นหา อัตโนมัติ */}
                    <form action="/search" method="GET" className="relative group">
                        <input
                            type="text"
                            name="q" // ชื่อพารามิเตอร์ที่จะไปโผล่บน URL
                            placeholder="ค้นหาพัทยา, หัวหิน, หรือชื่อวิลล่า..."
                            className="w-full h-10 pl-10 pr-4 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all text-sm text-slate-800"
                        />
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"
                        />
                        {/* ปุ่ม Submit ซ่อนไว้ (กด Enter เพื่อค้นหาได้เลย) */}
                        <button type="submit" className="hidden">Search</button>
                    </form>
                </div>

                {/* 2.5 NAV LINKS (Desktop) */}
                <nav className="hidden md:flex items-center gap-6">
                    <Link href="/scoop" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                        บทความ
                    </Link>
                    <Link href="/search" className="text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
                        ค้นหาวิลล่า
                    </Link>
                </nav>

                {/* 3. SEARCH BUTTON (Mobile เท่านั้น) */}
                <div className="sm:hidden flex items-center">
                    {/* บนมือถือ ถ้ากดแว่นขยาย ให้เด้งไปหน้า /search เลย (จะใช้มือถือพิมพ์ง่ายกว่า) */}
                    <Link href="/search">
                        <Button variant="ghost" size="icon">
                            <Search size={22} className="text-slate-600" />
                        </Button>
                    </Link>
                </div>

            </div>
        </header>
    );
};