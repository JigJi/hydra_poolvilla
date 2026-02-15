import json

# นิยามกลุ่มของสิ่งอำนวยความสะดวก เพื่อให้ง่ายต่อการขยายผลและเลือกใช้สี
# แบ่งเป็นกลุ่ม: Fun (กิจกรรม), Wellness (สุขภาพ), Food (กิน), Logistics (การเดินทาง), Room (ห้องพัก)
FACILITY_MAP = {
    # --- [1. Fun & Entertainment - เน้นสี Cyan/Purple] ---
    "karaoke": {"keywords": ["คาราโอเกะ", "karaoke"], "label": "คาราโอเกะ", "icon": "Mic2", "color": "purple"},
    "pool_table": {"keywords": ["โต๊ะพูล", "สนุ๊กเกอร์", "billiards", "pool table"], "label": "โต๊ะพูล/สนุกเกอร์", "icon": "Target", "color": "indigo"},
    "slider": {"keywords": ["สไลเดอร์", "water slide"], "label": "สไลเดอร์น้ำ", "icon": "Waves", "color": "cyan"},
    "bbq": {"keywords": ["บาร์บีคิว", "bbq", "ปิ้งย่าง"], "label": "เตาปิ้งย่าง BBQ", "icon": "Flame", "color": "orange"},
    
    # --- [2. Wellness & Luxury - เน้นสี Blue/Pink] ---
    "jacuzzi": {"keywords": ["อ่างน้ำอุ่น", "jacuzzi", "จากุซซี่", "อ่างแช่ตัว"], "label": "อ่างแช่ตัว/Jacuzzi", "icon": "Bath", "color": "blue"},
    "spa": {"keywords": ["สปา", "spa", "นวด", "massage"], "label": "สปา/นวด", "icon": "Sparkles", "color": "pink"},
    "fitness": {"keywords": ["ศูนย์ออกกำลังกาย", "ฟิตเนส", "fitness", "gym"], "label": "ฟิตเนส", "icon": "Dumbbell", "color": "slate"},
    "sauna": {"keywords": ["ซาวน่า", "sauna"], "label": "ซาวน่า", "icon": "Thermometer", "color": "red"},

    # --- [3. Views & Location - เน้นสี Yellow/Green] ---
    "beachfront": {"keywords": ["ติดชายหาด", "ริมหาด", "beachfront"], "label": "ติดชายหาด", "icon": "Umbrella", "color": "yellow"},
    "seaview": {"keywords": ["วิวทะเล", "sea view"], "label": "วิวทะเล", "icon": "Palmtree", "color": "blue"},
    "mountainview": {"keywords": ["วิวภูเขา", "mountain view"], "label": "วิวภูเขา", "icon": "Mountain", "color": "emerald"},
    "pet_friendly": {"keywords": ["สัตว์เลี้ยงเข้าได้", "pets allowed"], "label": "สัตว์เลี้ยงเข้าได้", "icon": "PawPrint", "color": "green"},

    # --- [4. Food & Drink - เน้นสี Orange/Red] ---
    "breakfast": {"keywords": ["อาหารเช้า", "breakfast"], "label": "มีอาหารเช้า", "icon": "Coffee", "color": "amber"},
    "restaurant": {"keywords": ["ห้องอาหาร", "ภัตตาคาร", "restaurant"], "label": "ร้านอาหารในที่พัก", "icon": "Utensils", "color": "rose"},
    "bar": {"keywords": ["บาร์", "bar"], "label": "มินิบาร์/บาร์", "icon": "Wine", "color": "violet"},
    "kitchen": {"keywords": ["ห้องครัว", "ห้องครัวส่วนตัว", "kitchen"], "label": "อุปกรณ์ครัวครบ", "icon": "ChefHat", "color": "orange"},

    # --- [5. Logistics & Standard - เน้นสี Gray/Blue] ---
    "wifi": {"keywords": ["wi-fi", "อินเทอร์เน็ตไร้สาย"], "label": "Free Wi-Fi", "icon": "Wifi", "color": "sky"},
    "parking": {"keywords": ["ที่จอดรถ", "parking"], "label": "ที่จอดรถฟรี", "icon": "Car", "color": "zinc"},
    "airport_shuttle": {"keywords": ["รถรับส่งสนามบิน", "airport shuttle"], "label": "รถรับส่งสนามบิน", "icon": "Plane", "color": "blue"},
    "charging_station": {"keywords": ["ชาร์จรถยนต์ไฟฟ้า", "ev charging"], "label": "ที่ชาร์จรถ EV", "icon": "Zap", "color": "green"},
    "family_room": {"keywords": ["ห้องสำหรับครอบครัว", "family room"], "label": "เหมาะกับครอบครัว", "icon": "Users", "color": "blue"},

    # --- [ 6. Family & Kids (กลุ่มเด็กและครอบครัว) - สี Sky/Blue ] ---
    "kid_friendly": {
        "keywords": ["เด็ก", "สโมสรเด็ก", "สนามเด็กเล่น", "kids club", "playground", "สระว่ายน้ำเด็ก", "kids pool", "babysitting"], 
        "label": "เหมาะสำหรับเด็ก", "icon": "Baby", "color": "sky"
    },

    # --- [ 7. Accessibility & Elderly (กลุ่มผู้สูงอายุ/ผู้พิการ) - สี Slate ] ---
    "accessibility": {
        "keywords": ["ผู้พิการ", "รถเข็น", "wheelchair", "accessible", "ทางลาด", "ห้องพักสำหรับผู้พิการ"], 
        "label": "รองรับรถเข็น/ผู้สูงอายุ", "icon": "Accessibility", "color": "slate"
    },

    # --- [ 8. Pet Friendly (กลุ่มคนรักสัตว์) - สี Green ] ---
    "pet_friendly": {
        "keywords": ["สัตว์เลี้ยง", "สุนัข", "แมว", "pets allowed", "pet friendly", "นำสัตว์เลี้ยงเข้าพักได้"], 
        "label": "สัตว์เลี้ยงเข้าได้", "icon": "PawPrint", "color": "green"
    },
    
    # --- [ 9. Special Needs (เบ็ดเตล็ดที่ดูมีอะไร) ] ---
    "elevator": {
        "keywords": ["ลิฟต์", "elevator", "lift"], 
        "label": "มีลิฟต์", "icon": "ArrowUpCircle", "color": "gray"
    },

    # --- [กลุ่มสระและโลเคชั่นพิเศษ] ---
    "salt_water_pool": {"keywords": ["สระน้ำเกลือ", "salt water pool"], "label": "สระน้ำเกลือ", "icon": "Sparkles", "color": "blue"},
    "infinity_pool": {"keywords": ["สระไร้ขอบ", "infinity pool"], "label": "สระไร้ขอบ", "icon": "Waves", "color": "cyan"},

    # --- [ปรับปรุงใหม่: สายปาร์ตี้/พักผ่อน] ---
    "smoking_area": {
        "keywords": ["เขตสูบบุหรี่", "พื้นที่สูบบุหรี่", "smoking area"], 
        "label": "มีพื้นที่สูบบุหรี่", "icon": "Wind", "color": "zinc" 
    },
}

def get_facility_tags(raw_data):
    """
    ฟังก์ชันเดียวที่กวาดทุกอย่างจาก JSON
    """
    if not raw_data:
        return []

    # แปลงจาก String เป็น Dict (ถ้าจำเป็น)
    if isinstance(raw_data, str):
        try:
            data = json.loads(raw_data)
        except:
            return []
    else:
        data = raw_data

    # 1. รวบรวมข้อความทั้งหมดที่จะค้นหา (Flatten Everything)
    search_text = []
    
    # ดึงจากยอดนิยม (Popular)
    search_text.extend([str(item).lower() for item in data.get("popular", [])])
    
    # ดึงจากหมวดหมู่ (Categories) ลึกเข้าไปถึงรายการย่อย
    for cat in data.get("categories", []):
        search_text.append(str(cat.get("name", "")).lower())
        search_text.extend([str(item).lower() for item in cat.get("items", [])])

    # รวมเป็นประโยคยาวๆ ประโยคเดียวเพื่อให้ค้นหาง่าย
    all_text = " ".join(search_text)

    # 2. ทำการ Match กับ Map
    matched_tags = []
    for tag_id, config in FACILITY_MAP.items():
        if any(keyword in all_text for keyword in config["keywords"]):
            # ส่งออกเฉพาะข้อมูลที่ใช้โชว์หน้า UI
            matched_tags.append({
                "id": tag_id,
                "label": config["label"],
                "icon": config["icon"],
                "color": config["color"]
            })

    return matched_tags