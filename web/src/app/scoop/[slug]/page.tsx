import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Users, Bed, Bath } from "lucide-react";

export default async function ScoopPage({ params }: { params: { slug: string } }) {
    // 1. ดึงข้อมูล (ในโปรเจกต์จริงเราจะกรองตาม slug หรือ category)
    // ตอนนี้ผมดึง 10 ที่ล่าสุดมาโชว์เป็นตัวอย่างก่อน
    const villas = await prisma.villa.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });

    return (
        <div className="bg-slate-50 min-h-screen pb-20">
            {/* --- Hero Section ของบทความ --- */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <img
                    src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750"
                    className="w-full h-full object-cover"
                    alt="Cover"
                />
                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center p-4">
                    <Badge className="mb-4 bg-blue-500 hover:bg-blue-600">Editor's Choice</Badge>
                    <h1 className="text-4xl md:text-6xl font-bold text-white max-w-4xl leading-tight">
                        10 พูลวิลล่าหัวหินปังๆ ปี 2026 สระว่ายน้ำส่วนตัว วิวสวยจนใจเจ็บ!
                    </h1>
                    <p className="text-slate-200 mt-6 text-lg md:text-xl max-w-2xl">
                        หน้าร้อนนี้ไม่รู้จะไปไหน... เราคัดมาให้แล้วกับพูลวิลล่าตัวท็อปในหัวหิน
                        เดินทางง่าย ใกล้กรุงเทพฯ จะมากับครอบครัวหรือแก๊งเพื่อนก็ฟินแน่นอน
                    </p>
                </div>
            </div>

            {/* --- Content List (1-10) --- */}
            <div className="container mx-auto mt-12 px-4 max-w-4xl">
                <div className="space-y-20">
                    {villas.map((villa, index) => (
                        <div key={villa.id} className="group">
                            {/* ลำดับตัวเลข */}
                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-6xl font-black text-blue-100 group-hover:text-blue-200 transition-colors">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                                <h2 className="text-3xl font-bold text-slate-800">{villa.title}</h2>
                            </div>

                            {/* รูปภาพแกลเลอรีจำลอง */}
                            <div className="rounded-3xl overflow-hidden shadow-2xl mb-8">
                                <img
                                    src={villa.coverImage || ""}
                                    className="w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700"
                                    alt={villa.title}
                                />
                            </div>

                            {/* รายละเอียด */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
                                <div className="flex flex-wrap gap-4 mb-6 text-sm text-slate-500">
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {villa.province}</span>
                                    <span className="flex items-center gap-1.5"><Users size={16} /> รองรับ {villa.maxGuests} ท่าน</span>
                                    <span className="flex items-center gap-1.5"><Bed size={16} /> {villa.bedrooms} ห้องนอน</span>
                                    <span className="flex items-center gap-1.5"><Bath size={16} /> {villa.bathrooms} ห้องน้ำ</span>
                                </div>

                                {/* --- ส่วนที่ AI จะช่วยปั่นคำบรรยาย --- */}
                                <p className="text-slate-600 leading-relaxed text-lg mb-8">
                                    {/* ในอนาคตเราจะเอาฟิลด์ที่ AI ปั่นไว้มาลงตรงนี้ */}
                                    สำหรับใครที่ชอบความเป็นส่วนตัว {villa.title} คือคำตอบที่ใช่ที่สุดครับ
                                    โดดเด่นด้วยดีไซน์ที่เน้นความโมเดิร์นตัดกับสีน้ำเงินของสระว่ายน้ำขนาดใหญ่
                                    ภายในบ้านตกแต่งได้อย่างหรูหรา พร้อมอุปกรณ์ทำครัวครบชุด
                                    ตกเย็นจะปิ้งย่างอาหารทะเลริมสระก็ทำได้แบบฟินๆ บอกเลยว่าคุ้มค่าเกินราคาแน่นอน!
                                </p>

                                {/* ปุ่ม CTA (Affiliate) */}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button className="flex-1 h-14 text-lg bg-blue-600 hover:bg-blue-700 rounded-2xl gap-2">
                                        เช็คราคาและจองผ่าน Agoda <ExternalLink size={20} />
                                    </Button>
                                    <Button variant="outline" className="flex-1 h-14 text-lg border-2 rounded-2xl">
                                        ดูรีวิวฉบับเต็ม
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}