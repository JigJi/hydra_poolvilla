# scraper/utils/enrichment/guests.py

def get_guest_data(raw_guests, bedrooms, price_daily):
    """
    คำนวณและเกลาข้อมูลจำนวนแขก + ราคาต่อคน
    """
    # 1. เกลาจำนวนแขก (Normalization)
    final_guests = raw_guests if raw_guests and raw_guests > 0 else 0
    beds = bedrooms if bedrooms and bedrooms > 0 else 1

    if final_guests <= 0 or final_guests < beds:
        final_guests = beds * 2
    
    if beds == 1 and final_guests > 6:
        final_guests = 4

    # 2. คำนวณราคาต่อคน
    price_pp = None
    if price_daily and final_guests > 0:
        price_pp = round(price_daily / final_guests)

    return {
        "max_guests": final_guests,
        "price_per_person": price_pp
    }