// components/layout/Navbar.tsx
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export const Navbar = () => {
    return (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 h-[65px] flex items-center justify-between">
                <Link href="/">
                    <h1 className="text-xl font-black tracking-tight text-blue-600 cursor-pointer">
                        PoolVillaFinder
                    </h1>
                </Link>
                <div className="hidden md:block flex-1"></div>
                <Button variant="ghost" size="icon">
                    <Search size={22} className="text-slate-600" />
                </Button>
            </div>
        </header>
    );
};