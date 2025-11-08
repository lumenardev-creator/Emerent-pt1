"""
Database migration script for AKTA MMI
Executes SQL migrations against Supabase PostgreSQL
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_supabase_client() -> Client:
    """Create Supabase client with service role key"""
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']
    return create_client(url, key)

def run_migration(sql_file: str):
    """Execute SQL migration file"""
    client = get_supabase_client()
    
    # Read SQL file
    sql_path = ROOT_DIR / 'migrations' / sql_file
    with open(sql_path, 'r') as f:
        sql_content = f.read()
    
    print(f"📝 Executing migration: {sql_file}")
    
    # Split by semicolons and execute each statement
    # Note: Supabase REST API doesn't directly execute raw SQL
    # We'll need to use the Supabase SQL Editor or PostgREST
    
    # For now, print instructions
    print("""
    ⚠️  MANUAL MIGRATION REQUIRED:
    
    1. Go to your Supabase Dashboard
    2. Navigate to: SQL Editor
    3. Copy and paste the content from: backend/migrations/001_initial_schema.sql
    4. Click 'Run' to execute the migration
    
    OR use the Supabase CLI:
    
    supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.okivbxiwisftrboyifyo.supabase.co:5432/postgres"
    
    Migration file location:
    {sql_path}
    """)
    
    return True

if __name__ == '__main__':
    print("🚀 AKTA MMI - Database Migration")
    print("=" * 50)
    
    # Run initial schema migration
    run_migration('001_initial_schema.sql')
    
    print("\n✅ Migration instructions displayed")
    print("   Please execute the SQL in Supabase Dashboard")
