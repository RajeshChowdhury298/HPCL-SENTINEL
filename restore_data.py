import pandas as pd
from supabase import create_client
import os

# 1. Configuration
url = "https://xygmcfkhooxpyplexkxd.supabase.co"
key = "sb_publishable_KdaKuDR8pDhC8tOSSuBWpw_Ek3Q3OCD"
supabase = create_client(url, key)

def restore():
    # 2. Check if file exists
    file_path = 'hpcl_preprocessed_leads.csv'
    if not os.path.exists(file_path):
        print(f"❌ Error: {file_path} not found in this directory!")
        return

    # 3. Load CSV
    print("📖 Reading CSV...")
    df = pd.read_csv(file_path)

    # 4. Clean Data (Handle types manually to be safe)
    df['confidence_score'] = df['confidence_score'].astype(float)
    df['priority_score'] = df['priority_score'].astype(float)
    df['is_verified'] = df['is_verified'].map({'True': True, 'False': False, True: True, False: False})
    
    # Fill empty values with None (Supabase NULL)
    df = df.where(pd.notnull(df), None)

    # 5. Bulk Insert in batches
    records = df.to_dict(orient='records')
    print(f"🚀 Attempting to insert {len(records)} rows...")

    batch_size = 50
    for i in range(0, len(records), batch_size):
        batch = records[i : i + batch_size]
        try:
            supabase.table("leads").insert(batch).execute()
            print(f"✅ Batch {i//batch_size + 1} inserted successfully.")
        except Exception as e:
            print(f"❌ Error in Batch {i//batch_size + 1}: {e}")

if __name__ == "__main__":
    restore()