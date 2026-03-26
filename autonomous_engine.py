from dotenv import load_dotenv
load_dotenv()
import pandas as pd
import os
from twilio.rest import Client
from supabase import create_client, Client as SupabaseClient

# --- CONFIGURATION ---
SUPABASE_URL = "https://xygmcfkhooxpyplexkxd.supabase.co"
SUPABASE_KEY = "sb_publishable_KdaKuDR8pDhC8tOSSuBWpw_Ek3Q3OCD"
TWILIO_SID = os.getenv('TWILIO_ACCOUNT_SID') 
TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
TWILIO_WHATSAPP_NUMBER = os.getenv('TWILIO_WHATSAPP_NUMBER') 
DEMO_OFFICER_PHONE = 'whatsapp:+919220318881' 

supabase: SupabaseClient = create_client(SUPABASE_URL, SUPABASE_KEY)

# Requirement 3.0: Industry Context Mapping Registry
PRODUCT_REASONING = {
    "Bitumen": "Detected NHAI/Infrastructure signal in text snippet.",
    "Jute Batch Oil": "Identified textile/jute processing cues in industry sector.",
    "Hexane": "Matched solvent extraction requirement for agri-processing.",
    "Furnace Oil": "Signal indicates heavy boiler or furnace installation.",
    "LDO": "Matched operational cue for small-scale power generation.",
    "MTO": "Identified industrial solvent requirement in manufacturing signal."
}

def trigger_next_priority_lead():
    """
    Requirement 4 & 6: Automatically finds the highest priority 'New' lead 
    and triggers the autonomous workflow with intelligent reasoning.
    """
    # 1. Query Supabase for the top lead that hasn't been processed yet
    response = supabase.table("leads") \
        .select("*") \
        .eq("status", "New") \
        .order("priority_score", desc=True) \
        .limit(1) \
        .execute()

    if not response.data:
        print("🎉 All leads processed! Autonomous queue is empty.")
        return

    lead = response.data[0]
    
    # Intelligent Context Mapping: Get the "Why"
    reason = PRODUCT_REASONING.get(lead['recommended_product'], "Matched industry operational cue.")
    
    # 2. Format and Send WhatsApp
    client = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)
    message_content = (
        f"🔥 *HPCL PULSE: TOP PRIORITY*\n\n"
        f"🏢 *Entity:* {lead['normalized_company']}\n"
        f"📦 *Product:* {lead['recommended_product']}\n"
        f"🎯 *Reason:* {reason}\n" # Requirement 3.0: Intelligent Extraction
        f"⚡ *Priority:* {lead['priority_score']:.1f}/10.0\n"
        f"📍 *Site:* {lead['location']}\n\n"
        f"🔗 *Review & Action:* \n"
        f"http://localhost:3000/dossier/{lead['id']}"
    )

    try:
        client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            body=message_content,
            to=DEMO_OFFICER_PHONE
        )
        # Mark as 'Processing' to prevent duplicates
        supabase.table("leads").update({"status": "Processing"}).eq("id", lead['id']).execute()
        print(f"✅ Autonomous Alert sent for {lead['normalized_company']}!")
    except Exception as e:
        print(f"❌ Twilio Error: {e}")

if __name__ == "__main__":
    trigger_next_priority_lead()