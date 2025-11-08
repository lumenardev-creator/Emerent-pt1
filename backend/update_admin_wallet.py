"""
Update admin wallet address in database
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from algosdk import mnemonic, account
from supabase import create_client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_supabase_client():
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']
    return create_client(url, key)

def get_deployer_address():
    phrase = os.environ.get('DEPLOYER_MNEMONIC')
    if not phrase:
        raise Exception("DEPLOYER_MNEMONIC not found")
    
    private_key = mnemonic.to_private_key(phrase)
    address = account.address_from_private_key(private_key)
    return address

def update_admin_wallet():
    print("🔄 Updating admin wallet address...")
    
    client = get_supabase_client()
    deployer_address = get_deployer_address()
    
    print(f"📍 Deployer Address: {deployer_address}")
    
    # Get admin user
    response = client.table('admins').select('*').execute()
    
    if not response.data or len(response.data) == 0:
        print("❌ No admin found in database")
        return
    
    admin = response.data[0]
    admin_id = admin['id']
    
    # Update wallet address
    update_response = client.table('admins').update({
        'wallet_address': deployer_address
    }).eq('id', admin_id).execute()
    
    print(f"✅ Updated admin wallet address!")
    print(f"   Admin ID: {admin_id}")
    print(f"   Wallet: {deployer_address}")
    
    print("\n✅ Setup complete! Admin can now approve redistributions.")

if __name__ == '__main__':
    update_admin_wallet()
