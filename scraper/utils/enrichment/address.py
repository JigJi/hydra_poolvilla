import re

class LocationCleaner:
    def __init__(self):
        # 1. POSTCODE MAP (แม่นยำที่สุด - ใช้ระบุ District/Province หลัก)
        self.POSTCODE_MAP = {
            # ชลบุรี
            '20150': ('Pattaya', 'Chonburi'), '20260': ('Pattaya', 'Chonburi'),
            '20250': ('Sattahip', 'Chonburi'), '20000': ('Mueang Chonburi', 'Chonburi'),
            # ประจวบฯ
            '77110': ('Hua Hin', 'Prachuap Khiri Khan'), '77120': ('Pranburi', 'Prachuap Khiri Khan'),
            '77220': ('Pranburi', 'Prachuap Khiri Khan'), '77210': ('Sam Roi Yot', 'Prachuap Khiri Khan'),
            # เชียงใหม่
            '50000': ('Mueang Chiang Mai', 'Chiang Mai'), '50100': ('Mueang Chiang Mai', 'Chiang Mai'),
            '50230': ('Hang Dong', 'Chiang Mai'), '50180': ('Mae Rim', 'Chiang Mai'),
            '50210': ('San Sai', 'Chiang Mai'), '50220': ('Doi Saket', 'Chiang Mai'),
            '50150': ('Mae Taeng', 'Chiang Mai'), '50140': ('Mae Taeng', 'Chiang Mai'),
            '50170': ('Chiang Dao', 'Chiang Mai'),
            # ภูเก็ต
            '83000': ('Mueang Phuket', 'Phuket'), '83100': ('Mueang Phuket', 'Phuket'),
            '83130': ('Mueang Phuket', 'Phuket'), '83150': ('Kathu', 'Phuket'),
            '83120': ('Kathu', 'Phuket'), '83110': ('Thalang', 'Phuket'),
            # สุราษฎร์ (สมุย/พะงัน/เกาะเต่า)
            '84320': ('Ko Samui', 'Surat Thani'), '84140': ('Ko Samui', 'Surat Thani'),
            '84410': ('Ko Samui', 'Surat Thani'), '84280': ('Ko Pha-ngan', 'Surat Thani'),
            '84360': ('Ko Pha-ngan', 'Surat Thani'), # เกาะเต่าอยู่อำเภอเกาะพะงัน
            '84230': ('Ban Ta Khun', 'Surat Thani'), # เชี่ยวหลาน
            # กระบี่
            '81000': ('Mueang Krabi', 'Krabi'), '81180': ('Mueang Krabi', 'Krabi'),
            '81150': ('Ko Lanta', 'Krabi'), '81130': ('Nuea Khlong', 'Krabi'),
            # พังงา (แก้พวกหลุดไปกระบี่)
            '82160': ('Takua Thung', 'Phang Nga'), # โคกกลอย
            '82110': ('Mueang Phang Nga', 'Phang Nga'),
            '82190': ('Ko Yao', 'Phang Nga'),
            # เพชรบุรี
            '76120': ('Cha-am', 'Phetchaburi'), '76000': ('Mueang Phetchaburi', 'Phetchaburi'),
            '76170': ('Kaeng Krachan', 'Phetchaburi'),
            # เขาใหญ่/สระบุรี/นครนายก
            '30130': ('Pak Chong', 'Nakhon Ratchasima'), '30320': ('Pak Chong', 'Nakhon Ratchasima'),
            '26000': ('Mueang Nakhon Nayok', 'Nakhon Nayok'),
            '18220': ('Kaeng Khoi', 'Saraburi'), # แสลงพัน
            '18180': ('Muak Lek', 'Saraburi'),
            # ตราด
            '23170': ('Ko Chang', 'Trat'), '23120': ('Ko Kut', 'Trat'),
            # ระยอง
            '21130': ('Ban Chang', 'Rayong'), '21110': ('Klaeng', 'Rayong'),
        }

        # 2. KEYWORD CORRECTIONS (เก็บตกพวกไม่มี Postcode หรือชื่อไทย)
        # Format: "คำที่เจอ": ("อำเภอใหม่", "จังหวัดใหม่")
        self.KEYWORD_MAP = {
            # --- เชียงใหม่ & ลำพูน ---
            'baanthi': ('Ban Thi', 'Lamphun'), 'Lamphun': ('Mueang Lamphun', 'Lamphun'),
            'ช่อแล': ('Mae Taeng', 'Chiang Mai'), 'เมืองก๋าย': ('Mae Taeng', 'Chiang Mai'),
            'แม่แตง': ('Mae Taeng', 'Chiang Mai'), 'แม่แฝก': ('San Sai', 'Chiang Mai'),
            'ท่าวังตาล': ('Saraphi', 'Chiang Mai'), # เคยหลงไปสุราษฎร์
            'เมืองงาย': ('Chiang Dao', 'Chiang Mai'),
            'สันผีเสื้อ': ('Mueang Chiang Mai', 'Chiang Mai'), 'สันปูเลย': ('Doi Saket', 'Chiang Mai'),

            # --- ชลบุรี / ระยอง ---
            'Ban Huai Yai': ('Pattaya', 'Chonburi'), 'Huay Yai': ('Pattaya', 'Chonburi'),
            'Cholburi': ('Mueang Chonburi', 'Chonburi'),
            'พลา': ('Ban Chang', 'Rayong'), # ย้ายกลับระยอง
            'พลูตาหลวง': ('Sattahip', 'Chonburi'),
            'แกลง': ('Klaeng', 'Rayong'), 'Ban Chang': ('Ban Chang', 'Rayong'),

            # --- กระบี่ / พังงา (ย้ายจังหวัดให้ถูก) ---
            'Khok Kloi': ('Takua Thung', 'Phang Nga'), 'Natai Beach': ('Takua Thung', 'Phang Nga'),
            'Tha Yu': ('Takua Thung', 'Phang Nga'),
            'Koh Yao': ('Ko Yao', 'Phang Nga'), 'Ko Yao Noi': ('Ko Yao', 'Phang Nga'),
            'Phang Nga': ('Mueang Phang Nga', 'Phang Nga'), 'Phangnga': ('Mueang Phang Nga', 'Phang Nga'),
            'Phi Phi Island': ('Mueang Krabi', 'Krabi'), 'เหนือคลอง': ('Nuea Khlong', 'Krabi'),

            # --- โคราช / สระบุรี / นครนายก ---
            'Muak Lek': ('Muak Lek', 'Saraburi'), 'Sara Buri': ('Mueang Saraburi', 'Saraburi'),
            'สระบุรี': ('Mueang Saraburi', 'Saraburi'), 'แสลงพัน': ('Wang Muang', 'Saraburi'),
            'พญาเย็น': ('Pak Chong', 'Nakhon Ratchasima'),
            'นครราชสีมา': ('Mueang Nakhon Ratchasima', 'Nakhon Ratchasima'),
            'นคราชสีมา': ('Mueang Nakhon Ratchasima', 'Nakhon Ratchasima'),
            'Si Khio': ('Sikhio', 'Nakhon Ratchasima'),
            'Nakhon Nayok': ('Mueang Nakhon Nayok', 'Nakhon Nayok'),

            # --- เพชรบุรี ---
            'Petchburi': ('Mueang Phetchaburi', 'Phetchaburi'),
            'แก่งกระจาน': ('Kaeng Krachan', 'Phetchaburi'),
            'หาดเจ้าสำราญ': ('Mueang Phetchaburi', 'Phetchaburi'),

            # --- ประจวบฯ ---
            'Bo Nok': ('Mueang Prachuap Khiri Khan', 'Prachuap Khiri Khan'),
            'Khlong Wan': ('Mueang Prachuap Khiri Khan', 'Prachuap Khiri Khan'),
            'Prachuap Khiri Khan': ('Mueang Prachuap Khiri Khan', 'Prachuap Khiri Khan'),
            'Kui Buri': ('Kui Buri', 'Prachuap Khiri Khan'), 'กุยเหนือ': ('Kui Buri', 'Prachuap Khiri Khan'),
            'ทับสะแก': ('Thap Sakae', 'Prachuap Khiri Khan'), 'บางสะพาน': ('Bang Saphan', 'Prachuap Khiri Khan'),

            # --- สุราษฎร์ธานี ---
            'Bophut': ('Ko Samui', 'Surat Thani'),
            'เกาะเต่า': ('Ko Pha-ngan', 'Surat Thani'), 'Ko Tao': ('Ko Pha-ngan', 'Surat Thani'),
            'เชี่ยวหลาน': ('Ban Ta Khun', 'Surat Thani'),

            # --- ตราด ---
            'Klong Son': ('Ko Chang', 'Trat'), 'Koh Chang': ('Ko Chang', 'Trat'),
            'Koh Chang Tai': ('Ko Chang', 'Trat'), 'เกาะช้าง': ('Ko Chang', 'Trat'),
            'เกาะกูด': ('Ko Kut', 'Trat'),
            
            # --- ภูเก็ต ---
            'เขารูปช้าง': ('Mueang Phuket', 'Phuket'), # Fallback
        }

        # Regex Patterns
        self.postcode_regex = re.compile(r'\b(\d{5})\b')
        self.prefix_cleaner = re.compile(r'^(Tambon|Amphoe|Sub-district|District|ต\.|อ\.|ตำบล|อำเภอ)\s*', re.IGNORECASE)

    def process(self, address, current_district=None):
        """
        Input: Address, Current District
        Output: (New District, New Province, New SubDistrict)
        """
        dist, prov, sub = None, None, None

        # 1. ลองหาจาก Postcode ก่อน (แม่นสุด)
        if address:
            match = self.postcode_regex.search(address)
            if match:
                postcode = match.group(1)
                if postcode in self.POSTCODE_MAP:
                    dist, prov = self.POSTCODE_MAP[postcode]

        # 2. ถ้าไม่มี Postcode ให้หาจาก Keyword (Dictionary)
        if not dist:
            # เช็คใน Address
            target_text = (address or "") + " " + (current_district or "")
            for key, (d, p) in self.KEYWORD_MAP.items():
                if key.lower() in target_text.lower():
                    dist, prov = d, p
                    break

        # 3. ถ้าหา District ไม่ได้จริงๆ ให้ใช้ของเดิม แต่ Clean Prefix
        if not dist and current_district:
            dist = self.prefix_cleaner.sub('', current_district).strip()
            # ตรวจสอบว่าของเดิมอยู่ใน Keyword Map หรือไม่ (เผื่อเป็นภาษาไทยที่หลุดมา)
            for key, (d, p) in self.KEYWORD_MAP.items():
                if key.lower() == dist.lower():
                    dist, prov = d, p
                    break

        return dist, prov, sub # SubDistrict เว้นไว้ก่อนได้ หรือจะเพิ่ม Logic Regex ก็ได้

# สร้าง Instance ไว้รอเรียกใช้งาน
cleaner = LocationCleaner()