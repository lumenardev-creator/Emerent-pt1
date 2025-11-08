"""
Database connection and client for Supabase PostgreSQL
"""
import os
from supabase import create_client, Client
from typing import Optional

_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client singleton"""
    global _supabase_client
    
    if _supabase_client is None:
        url = os.environ['SUPABASE_URL']
        key = os.environ['SUPABASE_SERVICE_KEY']
        _supabase_client = create_client(url, key)
    
    return _supabase_client

def close_supabase_client():
    """Close Supabase client connection"""
    global _supabase_client
    if _supabase_client:
        # Supabase client doesn't have explicit close method
        _supabase_client = None
