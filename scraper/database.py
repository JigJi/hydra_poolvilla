import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# 1. โหลดตัวแปรจากไฟล์ .env
load_dotenv()

# 2. ดึงค่า Connection String
# ถ้าหาไม่เจอ ให้โยน Error บอกเราทันที จะได้ไม่ไปตายน้ำตื้น
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ Error: DATABASE_URL not found in .env file!")

# 3. สร้าง Engine (หัวใจของ SQLAlchemy)
# pool_size=10: เปิดท่อค้างไว้ 10 ท่อ เพื่อความเร็ว
# max_overflow=20: ถ้าคนใช้งานเยอะ ยอมให้งอกท่อเพิ่มได้อีก 20
engine = create_engine(DATABASE_URL, pool_size=10, max_overflow=20)

# 4. สร้างตัวเสก Session (SessionLocal)
# เราจะเรียกใช้ตัวนี้ทุกครั้งที่อยาก คุยกับ Database
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# (Optional) Helper function สำหรับ Dependency Injection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()