import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing Supabase credentials")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Create 'media' bucket if it doesn't exist
try:
    buckets = supabase.storage.list_buckets()
    bucket_names = [b.name for b in buckets]
    if "media" not in bucket_names:
        print("Creating 'media' bucket...")
        supabase.storage.create_bucket("media", options={"public": True})
        print("Bucket 'media' created successfully.")
    else:
        print("Bucket 'media' already exists.")
except Exception as e:
    print(f"Error checking/creating bucket: {e}")
