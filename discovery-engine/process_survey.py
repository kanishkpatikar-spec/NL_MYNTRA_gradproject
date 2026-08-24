import csv
import json
import time
import requests
import sys

CSV_FILE = "responses.csv"
API_URL = "http://127.0.0.1:8000/api/classify"

def process_survey():
    print(f"Reading {CSV_FILE}...")
    
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        success_count = 0
        for row in reader:
            # Combine relevant columns into a single natural language snippet for the LLM
            blocker = row.get("What's the single biggest thing stopping you from buying it? ", "")
            needs = row.get("What would need to happen for you to actually go ahead and buy it?", "")
            price_factor = row.get("How does price factor into whether you buy a wishlisted item? ", "")
            missing_info = row.get("What information do you wish Myntra showed you about the item, that it currently doesn't?", "")
            
            # Skip empty rows
            if not blocker and not needs:
                continue
                
            snippet = f"User is hesitating because: {blocker}. They need: {needs}. Price perspective: {price_factor}. Missing info: {missing_info}."
            print(f"\nProcessing: {snippet}")
            
            try:
                # Send to our FastAPI backend which handles LLM parsing and Supabase insertion
                response = requests.post(API_URL, json={"text": snippet})
                response.raise_for_status()
                result = response.json()
                
                print(f"[SUCCESS] Classified as: {result.get('tags', [])}")
                print(f"  Intensity: {result.get('intensity')}/5")
                success_count += 1
                
                # Small delay to avoid rate limiting on Groq API
                time.sleep(1.5)
                
            except Exception as e:
                print(f"[FAILED] Could not process this row. The AI might have rejected it.")
                # We just continue to the next row
                pass
                
    print(f"\n[DONE] Successfully processed {success_count} real survey responses into the database!")
    print("Run aggregation script next to update the dashboard charts.")

if __name__ == "__main__":
    process_survey()
