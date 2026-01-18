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
    aiSummary = Column(Text, nullable=True) # เอาไว้ Gen ใหม่ทีหลัง

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