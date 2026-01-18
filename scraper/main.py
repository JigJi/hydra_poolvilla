import asyncio
import re
import random
import json
import os
import urllib.parse
from datetime import datetime, timedelta
from playwright.async_api import async_playwright
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from database import DATABASE_URL
from models import Villa

engine = create_async_engine(
    DATABASE_URL, 
    echo=False,
    connect_args={
        "statement_cache_size": 0,         # ปิด cache สำหรับ pgbouncer
        "prepared_statement_cache_size": 0  # เสริมความมั่นใจว่าไม่มีการค้างของคำสั่ง
    }
)

AsyncSessionLocal = sessionmaker(
    bind=engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# --- 🎯 CONFIGURATION ---
TARGET_LOCATIONS = [
    {"name": "หาดป่าตอง", "province": "ภูเก็ต"},
    # {"name": "ชะอำ", "province": "เพชรบุรี"},
    # {"name": "หัวหิน", "province": "ประจวบคีรีขันธ์"},
#     {"name": "พัทยากลาง", "province": "ชลบุรี"},
#     {"name": "หาดจอมเทียน", "province": "ชลบุรี"},
#     {"name": "หาดบางแสน", "province": "ชลบุรี"},
#     {"name": "ถลาง", "province": "ภูเก็ต"},
#     {"name": "ปราณบุรี", "province": "ประจวบคีรีขันธ์"},
]

BASE_URL = "https://www.booking.com/searchresults.th.html"
IMG_BASE_URL = "https://cf.bstatic.com"

PROCESSED_IDS = set()

# --- 💾 DATABASE FUNCTION ---
async def save_snapshot(data):
    async with AsyncSessionLocal() as session:
        try:
            async with session.begin():
                stmt = insert(Villa).values(**data)
                stmt = stmt.on_conflict_do_update(
                    index_elements=[Villa.externalId], # เช็คตัวหลัก
                    set_={
                        "priceDaily": stmt.excluded.priceDaily,
                        "rating": stmt.excluded.rating,
                        "reviewCount": stmt.excluded.reviewCount,
                        "updatedAt": datetime.now(),
                        "isActive": True
                    }
                )
                await session.execute(stmt)
            await session.commit()
            return True
        except Exception as e:
            await session.rollback()
            # --- แก้ตรงนี้: ถ้าเจอว่า slug ซ้ำ ให้ถือว่า "บันทึกสำเร็จ (ในแง่ของบอท)" เพื่อให้รันต่อได้ ---
            if "UniqueViolationError" in str(e) or "duplicate key" in str(e):
                # print(f"      ℹ️  Skipped duplicate slug: {data.get('slug')}")
                return True # คืนค่า True เพื่อให้บอทไปทำตัวถัดไป ไม่ต้องหยุดทำงาน
            
            print(f"      ❌ DB Error: {e}")
            return False

# --- 🛡️ POPUP KILLER ---
async def handle_genius_popup(page):
    try:
        popup_selector = 'button[aria-label="ปิดข้อมูลเกี่ยวกับการเข้าสู่ระบบ"]'
        if await page.is_visible(popup_selector):
            await page.click(popup_selector)
            await page.wait_for_timeout(500)
    except: pass

# --- 🕵️‍♂️ ENGINE 1: JSON LISTENER ---
async def process_json_data(json_data, location_context):
    try:
        results = json_data.get("data", {}).get("searchQueries", {}).get("search", {}).get("results", [])
        if not results: results = json_data.get("results", [])
        if not results: return 0
        
        count = 0
        for item in results:
            basic_info = item.get("basicPropertyData", {})
            if not basic_info: continue
            
            external_id = str(basic_info.get("id"))
            if external_id in PROCESSED_IDS: continue

            slug = basic_info.get("pageName", f"villa-{external_id}")
            title = item.get("displayName", {}).get("text", "Unknown")
            
            loc_data = basic_info.get("location", {})
            real_district = loc_data.get("city") or location_context["name"]
            real_address = loc_data.get("address", "")
            
            main_photo = basic_info.get("photos", {}).get("main", {}).get("highResUrl", {}).get("relativeUrl")
            cover_image = f"{IMG_BASE_URL}{main_photo}" if main_photo else ""
            
            review_score = basic_info.get("reviewScore", {}).get("score", 0)
            review_count = basic_info.get("reviewScore", {}).get("reviewCount", 0)
            
            price = 0
            try:
                blocks = item.get("blocks", [])
                if blocks:
                    final_price = blocks[0].get("finalPrice", {}).get("amount", 0)
                    price = int(final_price)
            except: pass

            villa_data = {
                "externalId": external_id,
                "slug": slug,
                "title": title,
                "province": location_context["province"],
                "district": real_district,
                "address": real_address,
                "priceDaily": price,
                "rating": float(review_score) if review_score else 0,
                "reviewCount": int(review_count) if review_count else 0,
                "coverImage": cover_image,
                "sourceUrl": f"https://www.booking.com/hotel/th/{slug}.html",
                "maxGuests": 2,
                "bedrooms": 1,
                "bathrooms": 1,
                "isActive": True,
                "updatedAt": datetime.now()
            }
            
            if await save_snapshot(villa_data):
                PROCESSED_IDS.add(external_id)
                count += 1
        
        if count > 0:
            print(f"      ⚡ (JSON) Captured {count} items.")
        return count

    except Exception:
        return 0

# --- 🕵️‍♂️ ENGINE 2: HTML SCRAPER ---
async def scan_current_page_html(page, location_context):
    try:
        await page.wait_for_selector('[data-testid="property-card"]', timeout=3000)
    except: pass

    cards = await page.query_selector_all('[data-testid="property-card"]')
    if not cards: return 0
    
    new_items = 0
    for card in cards:
        try:
            link_el = await card.query_selector('a[data-testid="title-link"]')
            if not link_el: link_el = await card.query_selector('a')
            if not link_el: continue
            
            href = await link_el.get_attribute('href')
            if not href: continue
            clean_url = href.split('?')[0]
            if ".html" not in clean_url and "booking.com" not in clean_url: continue

            slug = clean_url.split('/')[-1].replace('.th.html', '').replace('.html', '')
            external_id = slug
            
            if external_id in PROCESSED_IDS: continue

            title_el = await card.query_selector('[data-testid="title"]')
            title = await title_el.inner_text() if title_el else "Unknown"
            
            price = 0
            price_el = await card.query_selector('[data-testid="price-and-discounted-price"]')
            if price_el:
                raw_price = await price_el.inner_text()
                digits = re.findall(r'\d+', raw_price.replace(',', ''))
                if digits: price = int(''.join(digits))

            img_el = await card.query_selector('[data-testid="image"]')
            cover_image = await img_el.get_attribute('src') if img_el else ""
            
            rating_el = await card.query_selector('[data-testid="review-score-link"] div')
            rating_text = await rating_el.inner_text() if rating_el else "0"
            try: rating = float(rating_text)
            except: rating = 0.0

            villa_data = {
                "externalId": external_id,
                "slug": slug,
                "title": title,
                "province": location_context["province"],
                "district": location_context["name"],
                "priceDaily": price,
                "rating": rating,
                "reviewCount": 0,
                "coverImage": cover_image,
                "sourceUrl": f"https://www.booking.com{clean_url}" if not clean_url.startswith('http') else clean_url,
                "maxGuests": 2,
                "bedrooms": 1,
                "bathrooms": 1,
                "isActive": True,
                "updatedAt": datetime.now()
            }
            
            if await save_snapshot(villa_data):
                PROCESSED_IDS.add(external_id)
                new_items += 1
            
        except Exception:
            continue
    
    if new_items > 0:
        print(f"      🔨 (HTML) Swept {new_items} unique items.")
    return new_items

# --- 🌪️ FORCE SCROLL HELPER ---
async def force_scroll_to_bottom(page):
    # Scroll แบบ JS
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    await page.wait_for_timeout(2000)
    
    # Scroll แบบกดปุ่ม End
    for i in range(3): 
        await page.keyboard.press("End")
        await page.wait_for_timeout(1000)
        await handle_genius_popup(page)

# --- 🌪️ GENTLE SCROLL (แก้ปัญหาเลื่อนเร็วเกินไป) ---
async def gentle_scroll_to_bottom(page):
    print("      🐢 Scrolling gently to load items...")
    
    # 1. เช็คความสูงเริ่มต้น
    previous_height = await page.evaluate("document.body.scrollHeight")
    current_scroll = 0
    
    while True:
        # 2. เลื่อนลงทีละนิด (ประมาณครึ่งหน้าจอ)
        # 600px กำลังดี ไม่มากไม่น้อยเกินไป
        current_scroll += 600 
        await page.evaluate(f"window.scrollTo(0, {current_scroll})")
        
        # 3. ⏳ หยุดรอ 0.5 - 1 วินาที ให้เว็บโหลดข้อมูล (สำคัญมาก!)
        await asyncio.sleep(random.uniform(0.5, 0.8))
        
        # 4. เช็คว่าถึงพื้นหรือยัง
        # ดึงความสูงล่าสุด (เผื่อมีของงอกเพิ่ม)
        new_height = await page.evaluate("document.body.scrollHeight")
        
        # ถ้าเลื่อนเลยความสูงจริงไปแล้ว แสดงว่าจบ
        if current_scroll >= new_height:
            # ย้ำครั้งสุดท้าย เลื่อนไปล่างสุดจริงๆ
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await asyncio.sleep(1)
            
            # เช็ค Double Check ว่ามันไม่โหลดเพิ่มแล้วจริงๆ
            final_height = await page.evaluate("document.body.scrollHeight")
            if final_height == new_height:
                break # จบการ Scroll
            else:
                previous_height = final_height # มีของมาเพิ่ม ไปต่อ!

# --- 🚜 CORE LOGIC ---
async def process_location(page, location):
    city = location["name"]
    print(f"\n🌍 Traveling to: {city} ({location['province']})...")
    
    # 1. เข้าหน้าเว็บ
    future_date = datetime.now() + timedelta(days=120)
    
    # 🧠 Logic เสริม: ถ้าวันนั้นดันไปตก "ศุกร์(4) หรือ เสาร์(5)" ให้ขยับไปเป็น "วันจันทร์"
    # (weekday: 0=Mon, 1=Tue, ..., 6=Sun)
    if future_date.weekday() >= 4: 
        # บวกเพิ่มไปอีกจนกว่าจะเป็นวันจันทร์ (เพื่อเลี่ยง Weekend ที่อาจจะเต็ม)
        future_date += timedelta(days=(7 - future_date.weekday()))

    checkin_date = future_date.strftime('%Y-%m-%d')
    checkout_date = (future_date + timedelta(days=1)).strftime('%Y-%m-%d')

    print(f"   📅 Targeting Date: {checkin_date} (Aiming for maximum vacancy)")
    
    # URL พื้นฐาน
    params = {
        "ss": city,
        "nflt": "ht_id=213", # Pool Villa
        "group_adults": "2",
        "no_rooms": "1",
        "checkin": checkin_date,
        "checkout": checkout_date
    }
    url = f"{BASE_URL}?{urllib.parse.urlencode(params)}"
    
    try:
        await page.goto(url, timeout=60000)
        await handle_genius_popup(page)
    except Exception as e:
        print(f"❌ Connection Failed: {e}")
        return

    # Loop การกดปุ่ม
    total_rounds = 0
    max_rounds = 50 # กันบอทค้าง
    
    while total_rounds < max_rounds:
        print(f"   🔄 Round {total_rounds + 1}: Scanning...")

        await gentle_scroll_to_bottom(page)
        
        # 1. เก็บของที่มีอยู่ตอนนี้ก่อน
        await scan_current_page_html(page, location)
        
        # 2. นับจำนวนการ์ดปัจจุบัน (เพื่อใช้เช็คว่ากดติดไหม)
        current_card_count = await page.locator('[data-testid="property-card"]').count()
        print(f"      📍 Current Cards: {current_card_count}")

        # 3. Force Scroll แบบโหดๆ (เพื่อให้ปุ่มโผล่)
        await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        await asyncio.sleep(1)
        await page.keyboard.press("End") # ย้ำด้วยปุ่ม End
        await asyncio.sleep(2) # รอ Animation ปุ่มเด้งขึ้นมา

        # 4. หาปุ่ม Load More (รวมทุก Selector ที่เป็นไปได้)
        # Booking ชอบเปลี่ยน ID ปุ่ม แต่ text มักจะเหมือนเดิม
        load_more_btn = page.locator('button:has-text("โหลดผลการค้นหาเพิ่มเติม"), button:has-text("Load more results"), [data-testid="show-more-results-button"]')
        
        if await load_more_btn.count() > 0 and await load_more_btn.first.is_visible():
            print("      🖱️ Found 'Load More' button. Clicking...")
            
            try:
                # คลิกแบบ Force (เผื่อมีอะไรบัง)
                await load_more_btn.first.click(force=True)
                
                # 🔥 KEY FIX: รอจนกว่าจำนวนการ์ดจะเพิ่มขึ้น (Timeout 15วิ)
                # ถ้ากดแล้วการ์ดไม่เพิ่มใน 15 วิ ถือว่าเน็ตช้าหรือสุดทางแล้ว
                try:
                    await page.wait_for_function(
                        f"document.querySelectorAll('[data-testid=\"property-card\"]').length > {current_card_count}",
                        timeout=15000
                    )
                    print("      ✅ New items loaded!")
                except:
                    print("      ⚠️ Clicked but no new items appeared (Might be end of list).")
                    break # ถ้ากดแล้วไม่มา ก็มักจะสุดแล้วจริงๆ
                    
            except Exception as e:
                print(f"      ⚠️ Click Error: {e}")
                break
        else:
            print("   🏁 No 'Load More' button found. Finished.")
            break
            
        total_rounds += 1
        await asyncio.sleep(random.uniform(2, 4)) # พักหายใจ

# --- 🚀 MAIN ENTRY POINT ---
async def run_harvester():
    print(f"🔥 Hydra Harvester V2.4 (The Zombie) Started...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            viewport={'width': 1366, 'height': 768},
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
        )
        
        page = await context.new_page()
        current_location_ctx = {"name": "", "province": ""}

        async def handle_response(response):
            if "graphql" in response.url or "searchresults" in response.url:
                try:
                    ctype = response.headers.get("content-type", "")
                    if "application/json" in ctype:
                        json_body = await response.json()
                        await process_json_data(json_body, current_location_ctx)
                except: pass

        page.on("response", handle_response)

        for location in TARGET_LOCATIONS:
            current_location_ctx["name"] = location["name"]
            current_location_ctx["province"] = location["province"]
            
            await process_location(page, location)
            print("   💤 Cooling down 5s...")
            await asyncio.sleep(5)

        await browser.close()
        print("\n🎉 Mission Complete! All locations scanned.")

if __name__ == "__main__":
    asyncio.run(run_harvester())