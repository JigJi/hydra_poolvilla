// src/components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';
import { Home, Search, BookOpen, Mail, Phone, Facebook } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-white border-t border-slate-200 pt-16 pb-8 mt-20">
            <div className="max-w-7xl mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">

                    {/* Column 1: Brand Info */}
                    <div className="space-y-4">
                        <h2 className="text-2xl font-black text-blue-600">PoolVillaFinder</h2>
                        <p className="text-slate-500 text-sm leading-relaxed">
                            แหล่งรวมพูลวิลล่าที่ดีที่สุดในไทย คัดสรรบ้านพักคุณภาพ ราคาคุ้มค่า
                            เพื่อให้วันหยุดของคุณเป็นช่วงเวลาที่แสนพิเศษ
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                                <Facebook size={20} />
                            </a>
                            <a href="mailto:contact@poolvillafinder.com" className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-blue-600 hover:text-white transition-all">
                                <Mail size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Column 2: Quick Links */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6">เมนูหลัก</h3>
                        <ul className="space-y-4">
                            <li><Link href="/" className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-2 transition-colors"><Home size={16} /> หน้าแรก</Link></li>
                            <li><Link href="/search" className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-2 transition-colors"><Search size={16} /> ค้นหาวิลล่า</Link></li>
                            <li><Link href="/scoop" className="text-slate-500 hover:text-blue-600 text-sm flex items-center gap-2 transition-colors"><BookOpen size={16} /> บทความทั้งหมด</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Top Destinations (SEO Booster!) */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6">ปลายทางยอดนิยม</h3>
                        <ul className="space-y-4">
                            <li><Link href="/scoop/top-pool-villas-pattaya-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าพัทยา</Link></li>
                            <li><Link href="/scoop/top-pool-villas-hua-hin-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าหัวหิน</Link></li>
                            <li><Link href="/scoop/top-pool-villas-mueang-chiang-mai-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าเชียงใหม่</Link></li>
                            <li><Link href="/scoop/top-pool-villas-mueang-phuket-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าภูเก็ต</Link></li>
                            <li><Link href="/scoop/top-pool-villas-ko-samui-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าเกาะสมุย</Link></li>
                            <li><Link href="/scoop/top-pool-villas-cha-am-2026" className="text-slate-500 hover:text-blue-600 text-sm transition-colors">พูลวิลล่าชะอำ</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Contact */}
                    <div>
                        <h3 className="font-bold text-slate-900 mb-6">ติดต่อเรา</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-slate-500">
                                <Mail size={18} className="text-blue-600 shrink-0" />
                                <span>support@poolvillafinder.com</span>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                    <p>© {currentYear} PoolVillaFinder.com - All Rights Reserved.</p>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-blue-600">ข้อกำหนดการใช้งาน</Link>
                        <Link href="/privacy" className="hover:text-blue-600">นโยบายความเป็นส่วนตัว</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;