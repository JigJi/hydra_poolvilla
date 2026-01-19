import asyncio
import re
import random
from datetime import datetime, timedelta

# --- Third-party Libs ---
from bs4 import BeautifulSoup
from sqlalchemy import select, update, func
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from playwright.async_api import async_playwright

# --- Local Models ---
# ตรวจสอบว่าไฟล์ models.py และ database.py อยู่ที่เดิมนะครับ
from models import Villa
from database import DATABASE_URL

# ==========================================
# 1. CONFIGURATION & DATABASE SETUP
# ==========================================
CONFIG = {
    "MIN_SLEEP": 5,
    "MAX_SLEEP": 10,
    "CONCURRENT_TABS": 2,
    "TIMEOUT": 60000,
    "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

# Database Engine Setup (Optimized for pgbouncer)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
    connect_args={
        "statement_cache_size": 0,          
        "prepared_statement_cache_size": 0, 
        "command_timeout": 60
    }
)
AsyncSessionLocal = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


# ==========================================
# 2. UTILITY & STEALTH TOOLS
# ==========================================
class ScraperUtils:
    @staticmethod
    def clean_text(text):
        """Clean whitespace and strip text."""
        if not text: return ""
        return re.sub(r'\s+', ' ', text).strip()

    @staticmethod
    async def apply_stealth(page):
        """Inject scripts to evade bot detection."""
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            window.chrome = { runtime: {} };
            Object.defineProperty(navigator, 'languages', { get: () => ['th-TH', 'th', 'en-US', 'en'] });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
        """)


# ==========================================
# 3. PARSING LOGIC (Final Boss Edition 🦾)
# ==========================================
class BookingParser:
    
    @staticmethod
    def _parse_room_table_logic(soup):
        """
        Logic แกะ Room Table (Final Polish ✨)
        - Name: ถ้าหาไม่เจอ ให้กวาด Text ดิบแล้วลบส่วนเตียงออก
        - Bedrooms: นับจากรายการใน Layout แทนการเดา
        - MaxGuests: ยึดตาม Logic เดิมที่แม่นแล้ว
        """
        print("   💎 Scanning Room Table (Final Polish)...")
        
        data = {
            "name": "", "priceDaily": 0, "currency": "THB",
            "specs": {"bedrooms": 0, "bathrooms": 1, "maxGuests": 2},
            "layout": {"rooms": [], "others": []}
        }

        # 1. หา Table
        table = soup.select_one('#hprt-table')
        if not table:
            rows = soup.select('table.hprt-table tbody > tr')
        else:
            rows = table.select('tbody > tr')
        
        if not rows: return data

        # 2. Smart Selection
        best_row = None
        best_score = -1
        
        for row in rows:
            cols = row.select('th, td')
            if len(cols) < 2: continue 
            
            # Scoring
            temp_name = ""
            name_el = cols[0].select_one('.hprt-roomtype-icon-link, .hprt-roomtype-link')
            if name_el: temp_name = ScraperUtils.clean_text(name_el.get_text())
            
            score = 0
            if "Villa" in temp_name or "วิลลา" in temp_name: score += 100
            if "Pool" in temp_name: score += 50
            if "Private" in temp_name: score += 30
            if score > best_score:
                best_score = score
                best_row = row
        
        if not best_row: best_row = rows[0]

        # 3. Extraction
        cols = best_row.select('th, td')
        col_name = cols[0]
        
        # --- 🛏️ Collect Layout First (เพื่อเอาไปนับห้องนอน) ---
        bed_items = []
        # เก็บ Text เตียงเพื่อเอาไปลบออกจากชื่อห้องทีหลัง
        bed_texts_to_remove = [] 
        
        bed_containers = col_name.select('.rt-bed-type, .bedroom_bed_type, .room-config li')
        if bed_containers:
            for item in bed_containers:
                txt = ScraperUtils.clean_text(item.get_text())
                if txt: 
                    bed_items.append(txt)
                    bed_texts_to_remove.append(txt)
        else:
            bed_wrapper = col_name.select_one('.hprt-roomtype-bed, .bed-types-wrapper')
            if bed_wrapper:
                txt = ScraperUtils.clean_text(bed_wrapper.get_text())
                if txt: 
                    bed_items.append(txt)
                    bed_texts_to_remove.append(txt)

        data['layout']['rooms'] = list(set(bed_items))

        # --- 🏷️ Name Extraction (Cleanup Mode) ---
        name_el = col_name.select_one('.hprt-roomtype-icon-link, .hprt-roomtype-link, a.hprt-roomtype-link')
        if name_el:
            data['name'] = ScraperUtils.clean_text(name_el.get_text())
        
        # Fallback: ถ้าชื่อว่าง ให้เอา Text ทั้งหมดในช่อง ลบด้วย Text ของเตียง
        if not data['name']:
            full_text = ScraperUtils.clean_text(col_name.get_text(" "))
            for bed_txt in bed_texts_to_remove:
                full_text = full_text.replace(bed_txt, "") # ลบส่วนที่เป็นเตียงออก
            
            # ลบคำขยะอื่นๆ
            full_text = full_text.replace("รายละเอียด:", "").strip()
            data['name'] = full_text[:100].strip() # เอาแค่ 100 ตัวอักษรแรกพอ

        # --- 🔢 Bedrooms Count (Smart Count) ---
        # นับจำนวนคำว่า "ห้องนอน" หรือ "Bedroom" ใน layout
        bedroom_count = 0
        for room in data['layout']['rooms']:
            if "ห้องนอน" in room or "Bedroom" in room:
                bedroom_count += 1
        
        if bedroom_count > 0:
            data['specs']['bedrooms'] = bedroom_count
        else:
            # ถ้าไม่เจอคำว่าห้องนอนในลิสต์ ลองหาจากชื่อห้อง
            match = re.search(r'(\d+)\s*(?:ห้องนอน|Bedroom)', data['name'], re.IGNORECASE)
            if match:
                data['specs']['bedrooms'] = int(match.group(1))
            elif len(data['layout']['rooms']) > 0:
                # ถ้ามีเตียงแต่ระบุห้องนอนไม่ได้ ให้เป็น 1 (Studio)
                data['specs']['bedrooms'] = 1

        # --- Guests & Price ---
        if len(cols) > 1:
            col_guest = cols[1]
            raw_text = ScraperUtils.clean_text(col_guest.get_text())
            match_num = re.search(r'[x×]\s*(\d+)', raw_text)
            if match_num:
                data['specs']['maxGuests'] = int(match_num.group(1))
            else:
                icons = col_guest.select('.bicon-occupancy, .bicon-person, i')
                valid = [i for i in icons if 'occupancy' in str(i) or 'person' in str(i)]
                if valid: data['specs']['maxGuests'] = len(valid)

        if len(cols) > 2:
            col_price = cols[2]
            price_text = ScraperUtils.clean_text(col_price.get_text())
            cur_price = col_price.select_one('.bui-price-display__value')
            if cur_price: price_text = cur_price.get_text()
            
            digits = re.findall(r'(\d{1,3}(?:,\d{3})*)', price_text)
            valid_prices = [int(d.replace(',', '')) for d in digits if int(d.replace(',', '')) > 500]
            if valid_prices: data['priceDaily'] = valid_prices[0]

        return data

    @staticmethod
    def _parse_facilities_logic(soup):
        """
        Logic แกะ Facilities (Simple & Clean ✨)
        - Based on User's Discovery: ใช้ Selector เรียบง่าย ไม่ต้องซับซ้อน
        - ใช้ separator='|' เพื่อแยก Title กับ Description ใน h3 ออกจากกัน
        """
        print("   🏊‍♂️ Scanning Facilities (Simple Mode)...")
        data = {
            "score": None,
            "popular": [],
            "categories": []
        }

        # 1. Score
        score_wrapper = soup.select_one('[data-testid="review-score-component"] div')
        if score_wrapper:
            m = re.search(r'(\d+\.?\d*)', score_wrapper.get_text())
            if m: data['score'] = float(m.group(1))

        # 2. Popular Facilities
        pop_items = []
        for li in soup.select('[data-testid="property-most-popular-facilities-wrapper"] li'):
            pop_items.append(ScraperUtils.clean_text(li.get_text()))
        data['popular'] = list(set(pop_items)) # 🛡️ ตัดตัวซ้ำ

        # 3. Categories (ตามสูตรพี่เป๊ะๆ) 🎯
        containers = soup.select('div[data-testid="facility-group-container"]')
        
        for container in containers:
            # หา h3 ก่อน
            h3 = container.select_one('h3')
            if not h3: continue

            # เทคนิค: ใช้ get_text(separator='|') เพื่อให้ "ชื่อหมวด" กับ "คำบรรยาย" มีขีดคั่น
            # ผลลัพธ์: "ที่จอดรถ|มีที่จอดรถส่วนตัว..."
            raw_h3 = h3.get_text(separator="|", strip=True)
            parts = raw_h3.split("|")
            
            category_name = parts[0].strip() # ตัวแรกคือชื่อหมวดเสมอ
            description = "".join(parts[1:]).strip() # ที่เหลือคือคำบรรยาย (ถ้ามี)

            items = []
            
            # ดึง List Items (li)
            for li in container.select('li'):
                txt = ScraperUtils.clean_text(li.get_text())
                txt = txt.replace("รวมในราคาแล้ว", "").strip()
                if txt: items.append(txt)

            # ถ้าใน li ไม่มีของ (เช่นหมวดที่จอดรถ) ให้เอาคำบรรยายจาก h3 มาใส่แทน
            if not items and description:
                items.append(description)

            # บันทึก
            if items:
                data['categories'].append({
                    "name": category_name,
                    "items": list(set(items))
                })
                
        return data

    @staticmethod
    def _parse_policies_logic(soup):
        """Logic แกะ House Rules"""
        print("   📋 Scanning House Rules...")
        policies = {}
        box = soup.select_one('#hp_policies_box')
        if not box: return {}

        rows = box.select('div.b0400e5749')
        for row in rows:
            header_el = row.select_one('.e7addce19e')
            content_el = row.select_one('.c92998be48')
            if header_el and content_el:
                header = ScraperUtils.clean_text(header_el.get_text())
                content = ScraperUtils.clean_text(content_el.get_text(" "))
                if "เช็คอิน" in header: policies['checkIn'] = content
                elif "เช็คเอาท์" in header: policies['checkOut'] = content
                elif "ยกเลิก" in header: policies['cancellation'] = content
                elif "เงินประกัน" in header: policies['damageDeposit'] = content
                elif "เด็ก" in header: policies['childPolicy'] = content
                elif "อายุ" in header: policies['ageRestriction'] = content
                elif "สูบบุหรี่" in header: policies['smoking'] = content
                elif "เสียงดัง" in header: policies['quietHours'] = content
                elif "สัตว์เลี้ยง" in header: policies['pets'] = content
                elif "Payment" in header or "ชำระ" in header: policies['payment'] = content
        return policies

    @staticmethod
    def _parse_nearby_places_logic(soup):
        """Logic แกะ Nearby Places (อันใหม่ล่าสุด)"""
        print("   📍 Scanning Nearby Places...")
        nearby_places = []
        poi_blocks = soup.select('div[data-testid="poi-block"], .hp-poi-content-container__column')
        
        for block in poi_blocks:
            header = block.find('h3') or block.find('div', class_='poi-list__title')
            category = ScraperUtils.clean_text(header.get_text()) if header else "General"
            
            for li in block.select('li'):
                texts = [ScraperUtils.clean_text(t.get_text()) for t in li.select('div, span') if ScraperUtils.clean_text(t.get_text())]
                name, dist = "", ""
                for t in texts:
                    if re.search(r'\d.*(?:กม\.|m|km|เมตร)', t): dist = t
                    elif len(t) > 2 and not name: name = t
                
                if name and dist:
                    nearby_places.append({"category": category, "name": name, "distance": dist})
        
        return nearby_places

    @staticmethod
    def _parse_reviews_logic(soup):
        print("   ⭐ Scanning Reviews (Direct Array)...")
        
        # Init ค่า Default
        result = {
            "rating": 0.0,
            "reviewCount": 0,
            "categories": [] 
        }

        # 1. Total Score & Count
        score_comp = soup.select_one('[data-testid="review-score-component"]')
        if score_comp:
            # Rating
            score_val_el = score_comp.select_one('div[aria-hidden="true"]')
            if score_val_el:
                try:
                    result['rating'] = float(score_val_el.get_text().strip())
                except: pass
            
            # Review Count
            count_text = score_comp.get_text()
            match = re.search(r'(\d+)\s*(?:reviews|ความคิดเห็น)', count_text, re.IGNORECASE)
            if match:
                result['reviewCount'] = int(match.group(1))

        # 2. Categories (Loop เก็บลง List)
        subscores = soup.select('[data-testid="review-subscore"]')
        for row in subscores:
            name_el = row.select_one('.d96a4619c0, span:first-child') or row.select_one('div:first-child')
            val_el = row.select_one('[aria-hidden="true"]')
            
            if name_el and val_el:
                key = ScraperUtils.clean_text(name_el.get_text())
                try:
                    val = float(ScraperUtils.clean_text(val_el.get_text()))
                    
                    result['categories'].append({
                        "category": key,
                        "rating": val
                    })
                except:
                    continue

        return result
    
    @staticmethod
    def parse_main_page(html):
        """Main entry point"""
        soup = BeautifulSoup(html, "html.parser")
        
        data = {
            "description": "", "address": "", "priceDaily": 0,
            "bedrooms": 0, "bathrooms": 0, "maxGuests": 2,
            "images": [], "locationHierarchy": [],
            "latitude": None, "longitude": None,
            "features": {},   
            "facilities": {}, 
            "policies": {},
            "nearbyPlaces": [],
            "rating": 0.0,
            "reviewCount": 0,
            "reviewData": []
        }

        # --- ⚡ CALL ALL SUB-PARSERS ---
        data['features'] = BookingParser._parse_room_table_logic(soup)
        data['facilities'] = BookingParser._parse_facilities_logic(soup)
        data['policies'] = BookingParser._parse_policies_logic(soup)
        data['nearbyPlaces'] = BookingParser._parse_nearby_places_logic(soup) # ✅ เรียกใช้งานตรงนี้
        # -------------------------------

        # Basic Info
        desc_el = soup.select_one('[data-testid="property-description"], #property_description_content')
        if desc_el: data['description'] = ScraperUtils.clean_text(desc_el.get_text(" "))

        # Address
        addr_el = None
        header_wrapper = soup.select_one('[data-testid="PropertyHeaderAddressDesktop-wrapper"]')
        if header_wrapper:
            target_text = header_wrapper.find(string=re.compile("ไทย"))
            if target_text and target_text.parent:
                addr_container = target_text.parent
                for hidden in addr_container.select('[aria-hidden="true"]'): hidden.decompose()
                addr_el = addr_container
        if not addr_el: addr_el = soup.select_one('[data-node_tt_id="location_score_tooltip"]')
        if not addr_el: addr_el = soup.select_one('.hp_address_subtitle')

        if addr_el:
            raw_addr = ScraperUtils.clean_text(addr_el.get_text(" ")) 
            for bad in ["แสดงบนแผนที่", "Show on map", "ทำเลดีเยี่ยม", "Excellent location", "–"]:
                raw_addr = raw_addr.replace(bad, "")
            data['address'] = re.sub(r'\s+,\s+', ', ', raw_addr).strip()

        # Images
        for img in soup.select('[data-testid="GalleryUnifiedDesktop-wrapper"] img, .bh-photo-grid img'):
            src = img.get('src') or img.get('data-lazy')
            if src: data['images'].append(re.sub(r'max\d+', 'max1280x900', src))
        data['images'] = list(set(data['images']))

        # Coordinates
        map_link = soup.select_one('a[data-atlas-latlng]')
        if map_link:
            try:
                lat, lng = map_link.get('data-atlas-latlng').split(',')
                data['latitude'], data['longitude'] = float(lat), float(lng)
            except: pass

        # Reviews
        reviews = BookingParser._parse_reviews_logic(soup)
        data['rating'] = reviews['rating']
        data['reviewCount'] = reviews['reviewCount']
        data['reviewData'] = reviews['categories']
            
        return data

# ==========================================
# 4. WORKER (Updated for Nearby Places)
# ==========================================

async def process_villa(sem, context, villa):
    async with sem:
        page = await context.new_page()
        await ScraperUtils.apply_stealth(page)

        try:
            future_date = datetime.now() + timedelta(days=120) 
            
            checkin = future_date.strftime('%Y-%m-%d')
            checkout = (future_date + timedelta(days=1)).strftime('%Y-%m-%d')
            
            target_url = (
                f"{villa.sourceUrl}?"
                f"lang=th&selected_currency=THB"
                f"&checkin={checkin}&checkout={checkout}"
                f"&group_adults=2&no_rooms=1"
            )

            print(f"   ⛏️  Opening: {villa.slug}")
            await page.goto(target_url, timeout=CONFIG["TIMEOUT"], wait_until="domcontentloaded")
            
            try:
                await page.wait_for_selector('[data-testid="property-description"]', timeout=15000)
            except:
                print(f"      ⚠️ Timeout (Content Load): {villa.slug}")
                await page.close()
                return

            await page.evaluate("window.scrollTo(0, 3000)") 
            await asyncio.sleep(2)

            try:
                # state="visible" คือต้องเห็นด้วยตาเปล่า (ไม่ใช่แค่มีใน DOM)
                await page.wait_for_selector(
                    'div[data-testid="facility-group-container"]', 
                    state="visible", 
                    timeout=15000  # ให้เวลามัน 15 วินาที
                )
                print("   ✅ Facilities Loaded!")
            except Exception:
                print("   ⚠️ Facilities wait timeout! (อาจจะไม่มีข้อมูล หรือเน็ตช้า)")

            # --- PARSING ---
            content = await page.content()
            data = BookingParser.parse_main_page(content)

            # --- SAVING ---
            async with AsyncSessionLocal() as session:
                room_specs = data['features'].get('specs', {})
                room_price = data['features'].get('priceDaily', 0)

                stmt = update(Villa).where(Villa.id == villa.id).values(
                    description=data.get('description'),
                    address=data.get('address') or Villa.address,
                    latitude=data.get('latitude'),
                    longitude=data.get('longitude'),
                    images=data.get('images'),
                    features=data.get('features'),   
                    facilities=data.get('facilities'), 
                    policies=data.get('policies'),
                    nearbyPlaces=data.get('nearbyPlaces'), 
                    rating=data.get('rating'),
                    reviewCount=data.get('reviewCount'),
                    reviewData=data.get('reviewData'),
                    priceDaily=data.get('priceDaily') or room_price or Villa.priceDaily,
                    bedrooms=data.get('bedrooms') or room_specs.get('bedrooms') or Villa.bedrooms,
                    bathrooms=data.get('bathrooms') or room_specs.get('bathrooms') or Villa.bathrooms,
                    maxGuests=data.get('maxGuests') or room_specs.get('maxGuests') or Villa.maxGuests,
                    
                    updatedAt=func.now()
                )
                await session.execute(stmt)
                await session.commit()
            print(f"      ✅ Saved: {villa.slug}")

        except Exception as e:
            print(f"      ❌ Error in {villa.slug}: {str(e)}")
        finally:
            await page.close()

async def run_enricher():
    print("🌙 Hydra Miner V3.5 (Refactored) Started...")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context(
            user_agent=CONFIG["USER_AGENT"],
            locale="th-TH"
        )
        
        sem = asyncio.Semaphore(CONFIG["CONCURRENT_TABS"])

        while True:
            async with AsyncSessionLocal() as session:
                stmt = select(Villa).where(
                    (Villa.reviewData == {}) | (Villa.reviewData == None)
                ).limit(10)
                # stmt = select(Villa).where(
                #     (Villa.facilities == {}) | (Villa.facilities == None)
                # ).order_by(func.random()).limit(10)
                result = await session.execute(stmt)
                villas = result.scalars().all()

                if not villas:
                    print("🎉 Mission Complete! No more villas to process.")
                    break

                print(f"\n🚀 Processing Batch: {len(villas)} villas")
                
                tasks = [process_villa(sem, context, v) for v in villas]
                await asyncio.gather(*tasks)
                
                print(f"--- Batch Finished ---")
                await asyncio.sleep(2)

                # print("🛑 Test run complete. Stopping script.")
                # break

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_enricher())