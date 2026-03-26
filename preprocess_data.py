import pandas as pd
import re

def preprocess_hpcl_data(input_file, output_file):
    # Load the generated CSV
    df = pd.read_csv(input_file)
    
    # 1. Entity Resolution: Normalize Company Names (Functional Req 2)
    # This removes Ltd, Corp, Group etc. to identify the actual "Parent Entity"
    def normalize_company(name):
        name = name.lower()
        name = re.sub(r'\b(ltd|industries|infra|group|enterprises|corp|limited)\b', '', name)
        return name.strip().title()

    df['normalized_company'] = df['company_name'].apply(normalize_company)

    # 2. Source Governance (Functional Req 1)
    # Assign a "Reliability Flag" based on source trust
    df['is_verified'] = df['source_trust'] >= 85

    # 3. Text Cleaning (Requirement 3)
    # Ensure raw text is lowercase and stripped for the NLP brain to read easily
    df['raw_text_snippet'] = df['raw_text_snippet'].str.lower().str.strip()

    # 4. Feature Engineering: Priority Score
    # Combine Urgency and Confidence to help Sales Officers prioritize
    df['priority_score'] = (df['urgency_score'] * 0.6) + (df['confidence_score'] * 4)

    # 5. Column Formatting
    # Ensure created_at is a proper datetime object
    df['created_at'] = pd.to_datetime(df['created_at'])

    # Save the preprocessed data
    df.to_csv(output_file, index=False)
    print(f"✅ Preprocessing Complete! File saved as: {output_file}")
    print(f"Stats: {df['is_verified'].sum()} Verified Leads, {df['normalized_company'].nunique()} Unique Entities.")

if __name__ == "__main__":
    preprocess_hpcl_data("hpcl_demo_leads.csv", "hpcl_preprocessed_leads.csv")