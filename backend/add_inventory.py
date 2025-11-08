"""
Add inventory to demo kiosks
"""
import os
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_supabase_client():
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']
    return create_client(url, key)

def add_inventory():
    client = get_supabase_client()
    
    print("📦 Adding inventory to kiosks...")
    
    # Get products
    products_response = client.table('products').select('id, sku').execute()
    products = {p['sku']: p['id'] for p in products_response.data}
    
    # Kiosk IDs
    kiosk_ids = {
        'kiosk1': '550e8400-e29b-41d4-a716-446655440001',
        'kiosk2': '550e8400-e29b-41d4-a716-446655440002'
    }
    
    # Inventory for Kiosk 1 (Downtown) - High water, low snacks
    kiosk1_inventory = [
        {'kiosk_id': kiosk_ids['kiosk1'], 'product_id': products['PROD-001'], 'quantity': 150, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk1'], 'product_id': products['PROD-002'], 'quantity': 30, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk1'], 'product_id': products['PROD-003'], 'quantity': 100, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk1'], 'product_id': products['PROD-004'], 'quantity': 40, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk1'], 'product_id': products['PROD-005'], 'quantity': 25, 'threshold': 20},
    ]
    
    # Inventory for Kiosk 2 (Airport) - Low water, high snacks
    kiosk2_inventory = [
        {'kiosk_id': kiosk_ids['kiosk2'], 'product_id': products['PROD-001'], 'quantity': 20, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk2'], 'product_id': products['PROD-002'], 'quantity': 120, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk2'], 'product_id': products['PROD-003'], 'quantity': 40, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk2'], 'product_id': products['PROD-004'], 'quantity': 90, 'threshold': 20},
        {'kiosk_id': kiosk_ids['kiosk2'], 'product_id': products['PROD-005'], 'quantity': 80, 'threshold': 20},
    ]
    
    for inv in kiosk1_inventory:
        try:
            client.table('kiosk_inventory').insert(inv).execute()
            print(f"✅ Added inventory to Kiosk 1")
        except Exception as e:
            print(f"⚠️  Inventory might exist: {e}")
    
    for inv in kiosk2_inventory:
        try:
            client.table('kiosk_inventory').insert(inv).execute()
            print(f"✅ Added inventory to Kiosk 2")
        except Exception as e:
            print(f"⚠️  Inventory might exist: {e}")
    
    print("\n✅ Inventory setup complete!")
    print("\n📊 Demo Scenario:")
    print("-" * 60)
    print("Kiosk 1 (Downtown): Has EXCESS water (150), LOW snacks (30)")
    print("Kiosk 2 (Airport): Has LOW water (20), EXCESS snacks (120)")
    print("\n💡 Perfect for testing redistributions!")
    print("-" * 60)

if __name__ == '__main__':
    add_inventory()
