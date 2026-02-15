# scraper/database.py

import os
import json
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

# โหลดค่าจาก .env (ตรวจสอบ path ให้ถูกว่า .env อยู่ไหน)
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class HydraDB:
    def __init__(self):
        # ใช้ DATABASE_URL จาก .env (ตัวที่เป็น Transaction Mode port 6543 หรือ Session 5432 ก็ได้สำหรับ Python script)
        self.dsn = DATABASE_URL 
        self.conn = None
        self.connect()

    def connect(self):
        try:
            self.conn = psycopg2.connect(self.dsn)
            print("✅ Connected to Hydra Database")
        except Exception as e:
            print(f"❌ Connection Failed: {e}")

    def upsert_villa(self, data):
        """
        Function นี้จะ Insert ข้อมูล ถ้ามี externalId ซ้ำจะทำการ Update แทน (Upsert)
        """
        if not self.conn or self.conn.closed:
            self.connect()

        # SQL Query สำหรับ Upsert
        # สังเกตการใช้ json.dumps() สำหรับ field ที่เป็น JSON (images, amenities)
        query = sql.SQL("""
            INSERT INTO "Villa" (
                "externalId", "title", "slug", "province", "district", "subDistrict",
                "address", "latitude", "longitude", "priceDaily", "maxGuests",
                "bedrooms", "bathrooms", "description", "coverImage", 
                "images", "amenities", "sourceUrl", "isActive", "updatedAt"
            ) VALUES (
                %(externalId)s, %(title)s, %(slug)s, %(province)s, %(district)s, %(subDistrict)s,
                %(address)s, %(latitude)s, %(longitude)s, %(priceDaily)s, %(maxGuests)s,
                %(bedrooms)s, %(bathrooms)s, %(description)s, %(coverImage)s, 
                %(images)s, %(amenities)s, %(sourceUrl)s, true, NOW()
            )
            ON CONFLICT ("externalId") DO UPDATE SET
                "priceDaily" = EXCLUDED."priceDaily",
                "updatedAt" = NOW(),
                "isActive" = true,
                "images" = EXCLUDED."images",
                "amenities" = EXCLUDED."amenities";
        """)

        try:
            with self.conn.cursor() as cur:
                # Prepare data: แปลง dict/list ให้เป็น JSON String สำหรับ Postgres
                params = data.copy()
                params['images'] = json.dumps(data.get('images', []))
                params['amenities'] = json.dumps(data.get('amenities', {}))
                
                cur.execute(query, params)
                self.conn.commit()
                print(f"💾 Saved: {data.get('title')} ({data.get('externalId')})")
                
        except Exception as e:
            self.conn.rollback()
            print(f"⚠️ Error saving {data.get('title', 'Unknown')}: {e}")

    def close(self):
        if self.conn:
            self.conn.close()