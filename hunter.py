import time
from supabase import create_client

url = "https://xygmcfkhooxpyplexkxd.supabase.co"
# If you have the SERVICE_ROLE_KEY, use it here to bypass all errors.
key = "sb_publishable_KdaKuDR8pDhC8tOSSuBWpw_Ek3Q3OCD" 

supabase = create_client(url, key)

def run_hunter():
    print("🚀 HPCL Pulse: Starting Web Intelligence Scan...")
    
    mock_news = [
        {"co": "BuildRight Infra", "text": "Won 200km Highway project", "loc": "Roorkee, Uttarakhand"},
        {"co": "SteelFlow Ltd", "text": "Installing 3 high-capacity furnaces", "loc": "Surat, Gujarat"},
        {"co": "Apex Textiles", "text": "New boiler unit for steam generation", "loc": "Ludhiana, Punjab"},
        {"co": "ShipYard Marine", "text": "Expanding bunker fuel storage facility", "loc": "Kochi, Kerala"}
    ]

    for news in mock_news:
        print(f"🔍 Analyzing signal: {news['co']}...")
        
        # Product Inference Logic
        product = "General Fuel"
        if "highway" in news['text'].lower(): product = "Bitumen"
        elif "furnace" in news['text'].lower(): product = "Furnace Oil (FO)"
        elif "boiler" in news['text'].lower(): product = "LDO (Light Diesel Oil)"
        elif "bunker" in news['text'].lower(): product = "Bunker Fuel"

        # Match exactly what the Dossier and Dashboard expect
        lead_data = {
            "company_name": news['co'],
            "normalized_company": news['co'],
            "industry_sector": "Industrial/Infrastructure",
            "recommended_product": product,
            "secondary_product": "LDO (Machinery Fuel)", 
            "confidence_score": 92,
            "priority_score": 9.2, 
            "reason": f"Signal Match: {news['text']}",
            "raw_text_snippet": news['text'],
            "location": news['loc'],
            "next_action": f"Reach out to procurement regarding {product} supply from nearest depot.",
            "status": "New"
        }
        
        try:
            supabase.table("leads").insert(lead_data).execute()
            print(f"✅ Lead Created: {news['co']} -> {product}")
        except Exception as e:
            print(f"❌ Insertion Error: {e}")

if __name__ == "__main__":
    run_hunter()