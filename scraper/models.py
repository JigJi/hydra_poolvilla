# scraper/models.py
import os
from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ARRAY
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class Villa(Base):
    __tablename__ = "Villa"
    __table_args__ = {"schema": "public"}

    # --- IDs ---
    id = Column(Integer, primary_key=True, autoincrement=True)
    externalId = Column(String, unique=True, nullable=False)
    slug = Column(String, unique=True, nullable=False)

    # --- Identity & Location ---
    title = Column(String, nullable=False)
    province = Column(String, nullable=False)
    district = Column(String, nullable=False) # อำเภอ/เมือง ที่เรา Search
    subDistrict = Column(String, nullable=True)
    address = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    locationHierarchy = Column(JSONB, default=[], nullable=False)

    # --- Pricing & Specs ---
    priceDaily = Column(Integer, nullable=False, default=0)
    currency = Column(String, default='THB', nullable=False)
    priceNote = Column(Text, nullable=True)
    maxGuests = Column(Integer, nullable=False, default=2)
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)

    # --- Content (Rich Data) ---
    description = Column(Text, nullable=True)
    hostInfo = Column(Text, nullable=True)
    content_listing = Column(Text, nullable=True)
    content_detail = Column(Text, nullable=True)

    # --- Visuals ---
    coverImage = Column(String, nullable=True)
    images = Column(JSONB, default=[], nullable=False)

    # --- Complex Data (The JSONB Magic) ---
    features = Column(JSONB, default={}, nullable=False) # {hasPool: true, ...}
    facilities = Column(JSONB, default={}, nullable=False) # {popular: [], categories: []}
    policies = Column(JSONB, default={}, nullable=False) # checkIn, checkOut, rules
    nearbyPlaces = Column(JSONB, default=[], nullable=False) # list of places
    
    # --- Social Proof ---
    rating = Column(Float, nullable=True)
    reviewCount = Column(Integer, default=0)
    reviewData = Column(JSONB, default={}, nullable=False) # reviews text

    # --- System ---
    sourceUrl = Column(String, nullable=True)
    affiliateUrl = Column(String, nullable=True)
    metaTitle = Column(String, nullable=True)
    metaDesc = Column(String, nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    isActive = Column(Boolean, default=True, nullable=False)

    # --- Timestamps ---
    createdAt = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updatedAt = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class Scoop(Base):
    # ชื่อ Table ต้องตรงกับในรูป (Postgres อาจมองเป็น scoop หรือ "Scoop" แล้วแต่ setup)
    # ถ้าสร้างผ่าน Prisma มักจะเป็น "Scoop"
    __tablename__ = "Scoop" 
    __table_args__ = {"schema": "public"}

    # --- Identity ---
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, nullable=False)
    
    # --- Content ---
    description = Column(Text, nullable=True) # ใน DB คุณใช้ description
    
    # ⚠️ Mapping: Python (cover_image) -> DB (coverImage)
    cover_image = Column("coverImage", String, nullable=True) 
    
    scoop_type = Column("type", String, default="listicle") # เลี่ยงคำสงวน python 'type'
    
    # ⚠️ JSONB Column
    rule = Column(JSONB, default={}, nullable=True) # เอาไว้เก็บ logic หรือ query filter
    
    # --- SEO (CamelCase Mapping) ---
    meta_title = Column("metaTitle", String, nullable=True)
    meta_description = Column("metaDescription", String, nullable=True)
    
    # --- System Status ---
    status = Column(String, default="published") # published/draft
    is_featured = Column("isFeatured", Boolean, default=False)
    author_name = Column("authorName", String, nullable=True)
    view_count = Column("viewCount", Integer, default=0)
    
    # --- Timestamps ---
    # ใช้ timezone=True เพราะในรูปเป็น timestamptz
    published_at = Column("publishedAt", DateTime(timezone=True), nullable=True)
    created_at = Column("createdAt", DateTime(timezone=True), server_default=func.now())
    updated_at = Column("updatedAt", DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    faq_schema = Column("faqSchema", JSONB, default=[], nullable=True)