import os
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

class Villa(Base):
    __tablename__ = "Villa"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    externalId = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    title = Column(String, nullable=False)
    province = Column(String, nullable=False)
    district = Column(String, nullable=False)
    subDistrict = Column(String, nullable=True)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    locationHierarchy = Column(JSONB, default=[], nullable=False)
    priceDaily = Column(Integer, nullable=False, default=0)
    currency = Column(String, default='THB', nullable=False)
    maxGuests = Column(Integer, nullable=False, default=2)
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)
    description = Column(Text, nullable=True)
    coverImage = Column(String, nullable=True)
    images = Column(JSONB, default=[], nullable=False)
    isActive = Column(Boolean, default=True, nullable=False)
    
    # --- Relationship 1:1 กับ VillaFeature ---
    # เชื่อมไปยังตาราง 30 Columns ที่เราแยกออกมา
    feature = relationship("VillaFeature", back_populates="villa", uselist=False, cascade="all, delete-orphan")

    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class VillaFeature(Base):
    __tablename__ = "VillaFeature"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    
    # Foreign Key เชื่อมกลับไปที่ Villa.id
    villaId = Column("villaId", Integer, ForeignKey("public.Villa.id", ondelete="CASCADE"), unique=True, nullable=False)
    villa = relationship("Villa", back_populates="feature")

    # --- 28 Bucketed Columns (Mapping ตรงกับที่ทำใน Python/CSV) ---
    price_daily_tier = Column(String, nullable=True)
    price_head_tier = Column(String, nullable=True)
    review_tier = Column(String, nullable=True)
    capacity_tier = Column(String, nullable=True)
    bedroom_tier = Column(String, nullable=True)
    rating_tier = Column(String, nullable=True)
    
    near_beach = Column(String, nullable=True)
    near_attraction = Column(String, nullable=True)
    near_public_transport = Column(String, nullable=True)
    near_airport = Column(String, nullable=True)
    near_lifestyle = Column(String, nullable=True)
    
    fac_entertainment = Column(String, nullable=True)
    fac_kitchen_dining = Column(String, nullable=True)
    fac_outdoor = Column(String, nullable=True)
    fac_view = Column(String, nullable=True)
    fac_wellness = Column(String, nullable=True)
    fac_service = Column(String, nullable=True)
    fac_safety = Column(String, nullable=True)
    fac_family = Column(String, nullable=True)
    fac_comfort = Column(String, nullable=True)
    
    is_pet_friendly = Column(String, nullable=True)
    
    review_wifi = Column(String, nullable=True)
    review_value = Column(String, nullable=True)
    review_facilities = Column(String, nullable=True)
    review_cleanliness = Column(String, nullable=True)
    review_comfort = Column(String, nullable=True)
    review_staff = Column(String, nullable=True)
    review_location = Column(String, nullable=True)

class Scoop(Base):
    __tablename__ = "Scoop" 
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    
    cover_image = Column("coverImage", String, nullable=True) 
    scoop_type = Column("type", String, default="listicle") 
    rule = Column(JSONB, default={}, nullable=True)
    
    # --- [เพิ่มใหม่] ---
    h1 = Column(String, nullable=True)
    count_villa = Column("countVilla", Integer, default=0)
    priority = Column(Integer, default=0)
    # ------------------

    meta_title = Column("metaTitle", String, nullable=True)
    meta_description = Column("metaDescription", String, nullable=True)
    
    status = Column(String, default="draft") # ตั้งเป็น draft ตามที่พี่สั่ง
    is_featured = Column("isFeatured", Boolean, default=False)
    author_name = Column("authorName", String, nullable=True)
    view_count = Column("viewCount", Integer, default=0)
    
    published_at = Column("publishedAt", DateTime(timezone=True), nullable=True)
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_indexed_at = Column("lastIndexedAt", DateTime(timezone=True), nullable=True)

    faq_schema = Column("faqSchema", JSONB, default=[], nullable=True)