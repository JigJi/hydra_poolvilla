import {
    Wifi, Car, Utensils, BedDouble, Wind, Lock, Tv, Waves,
    CheckCircle2, Mic2, Flame
} from 'lucide-react';

export const getFacilityIcon = (keyword: string) => {
    const k = keyword.toLowerCase();

    if (k.includes('wifi') || k.includes('เน็ต')) return <Wifi size={20} className="text-blue-500" />;
    if (k.includes('จอดรถ')) return <Car size={20} className="text-blue-500" />;
    if (k.includes('ครัว') || k.includes('ตู้เย็น')) return <Utensils size={20} className="text-blue-500" />;
    if (k.includes('สระ') || k.includes('pool')) return <Waves size={20} className="text-cyan-500" />;
    if (k.includes('แอร์') || k.includes('ปรับอากาศ')) return <Wind size={20} className="text-blue-500" />;
    if (k.includes('ทีวี')) return <Tv size={20} className="text-gray-600" />;
    if (k.includes('คาราโอเกะ')) return <Mic2 size={20} className="text-pink-500" />;
    if (k.includes('ปิ้งย่าง')) return <Flame size={20} className="text-orange-500" />;

    // Default Icon
    return <CheckCircle2 size={20} className="text-gray-400" />;
};