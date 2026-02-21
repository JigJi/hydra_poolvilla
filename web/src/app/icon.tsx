// src/app/icon.tsx
import { ImageResponse } from 'next/og';

// ตั้งค่าขนาดไอคอน
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 24,
                    background: '#2563eb', // สีน้ำเงิน Blue-600 แบบเดียวกับธีมเว็บคุณ
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    borderRadius: '20%', // ทำมุมโค้งมนให้น่ารัก
                }}
            >
                🏡
            </div>
        ),
        { ...size }
    );
}