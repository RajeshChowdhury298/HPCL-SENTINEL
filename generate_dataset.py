import pandas as pd
import random
import uuid
from datetime import datetime, timedelta

# --- 1. DOMAIN KNOWLEDGE (Mapping Signals to HP Products) ---
# This dictionary maps specific industrial "cues" to HP products.
# Use this to prove "Inference" during your presentation.
SECTOR_LOGIC = [
    {
        "sector": "Road Construction",
        "cues": ["NHAI highway project", "expressway construction", "pavement resurfacing", "bridge building"],
        "primary_product": "Bitumen",
        "secondary_product": "LDO (Machinery fuel)",
        "keywords": ["tarmac", "NHAI", "civil works"]
    },
    {
        "sector": "Manufacturing (Steel/Glass)",
        "cues": ["new blast furnace installation", "boiler capacity expansion", "heat treatment plant"],
        "primary_product": "Furnace Oil (FO)",
        "secondary_product": "LSHS (Low Sulphur fuel)",
        "keywords": ["thermal", "smelting", "billets"]
    },
    {
        "sector": "Textiles (Jute)",
        "cues": ["jute mill modernization", "batching oil procurement", "fibre softening process"],
        "primary_product": "JBO (Jute Batching Oil)",
        "secondary_product": "LDO (Genset fuel)",
        "keywords": ["fibre", "hessian", "batching"]
    },
    {
        "sector": "Chemical & Solvents",
        "cues": ["solvent extraction unit", "edible oil refinery setup", "industrial cleaning unit"],
        "primary_product": "Hexane",
        "secondary_product": "Solvent 1425",
        "keywords": ["extraction", "purification", "solvent"]
    },
    {
        "sector": "Power & Logistics",
        "cues": ["DG set maintenance", "captive power plant backup", "port bunkering service"],
        "primary_product": "LDO",
        "secondary_product": "HSD (High Speed Diesel)",
        "keywords": ["genset", "marine", "backup"]
    }
]

# --- 2. ENTITY & SOURCE DATA ---
COMPANIES = ["Adani", "L&T", "Reliance", "Tata", "Jindal", "GMR", "UltraTech", "Birla", "JSW", "Vedanta"]
SUFFIXES = ["Industries", "Infra", "Group", "Ltd", "Enterprises"]
LOCATIONS = ["Nagpur, MH", "Kolkata, WB", "Visakhapatnam, AP", "Jamshedpur, JH", "Ahmedabad, GJ", "Chennai, TN"]
SOURCES = [
    {"domain": "economictimes.indiatimes.com", "trust": 95},
    {"domain": "dgft.gov.in/tenders", "trust": 98},
    {"domain": "industry-news-wire.in", "trust": 70}
]

# --- 3. GENERATION FUNCTION ---
def generate_lead_dataset(num_rows=600):
    data = []
    base_date = datetime(2026, 1, 1)

    for i in range(num_rows):
        logic = random.choice(SECTOR_LOGIC)
        source = random.choice(SOURCES)
        company = f"{random.choice(COMPANIES)} {random.choice(SUFFIXES)}"
        cue = random.choice(logic["cues"])
        
        # Urgency is higher for "tenders" or "contracts"
        urgency = random.randint(8, 10) if "tender" in cue.lower() else random.randint(4, 7)
        
        # Create a "Raw Text Snippet" to prove AI reading capability
        raw_text = f"Notice: {company} is initiating a {cue} in {random.choice(LOCATIONS)}. This development indicates immediate requirement for {logic['primary_product']}."

        data.append({
            "id": str(uuid.uuid4()),
            "source_url": f"https://{source['domain']}/news/signal-{i}",
            "source_trust": source["trust"],
            "company_name": company,
            "industry_sector": logic["sector"],
            "raw_text_snippet": raw_text,
            "location": random.choice(LOCATIONS),
            "extracted_keywords": ", ".join(logic["keywords"]),
            "recommended_product": logic["primary_product"],
            "secondary_product": logic["secondary_product"],
            "urgency_score": urgency,
            "confidence_score": round(random.uniform(0.75, 0.98), 2),
            "status": "New",
            "created_at": (base_date + timedelta(days=random.randint(0, 35))).isoformat()
        })
    
    return pd.DataFrame(data)

# --- 4. EXECUTION ---
if __name__ == "__main__":
    df = generate_lead_dataset(600)
    # Save the dataframe to CSV
    df.to_csv("hpcl_demo_leads.csv", index=False)
    print(f"✅ Successfully created 'hpcl_demo_leads.csv' with {len(df)} rows.")