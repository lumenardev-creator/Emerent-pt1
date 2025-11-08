"""
Setup script to create demo users and data
Run this after database migration
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_supabase_client():
    url = os.environ['SUPABASE_URL']
    key = os.environ['SUPABASE_SERVICE_KEY']
    return create_client(url, key)

def create_demo_users():
    """Create demo users via Supabase Auth"""
    client = get_supabase_client()
    
    print("🔐 Creating Demo Users...")
    
    users_to_create = [
        {
            'email': 'admin@akta-mmi.com',
            'password': 'Admin123!',
            'role': 'admin',
            'full_name': 'Admin User'
        },
        {
            'email': 'kiosk1@akta-mmi.com',
            'password': 'Kiosk123!',
            'role': 'kiosk',
            'full_name': 'Kiosk Manager 1'
        },
        {
            'email': 'kiosk2@akta-mmi.com',
            'password': 'Kiosk123!',
            'role': 'kiosk',
            'full_name': 'Kiosk Manager 2'
        }
    ]
    
    created_users = {}
    
    for user_data in users_to_create:
        try:
            # Create user with auto-confirm
            response = client.auth.admin.create_user({
                'email': user_data['email'],
                'password': user_data['password'],
                'email_confirm': True,  # Auto-confirm email
                'user_metadata': {
                    'full_name': user_data['full_name']
                }
            })
            
            user_id = response.user.id
            created_users[user_data['email']] = {
                'user_id': user_id,
                'role': user_data['role'],
                'full_name': user_data['full_name']
            }
            
            print(f"✅ Created user: {user_data['email']} (ID: {user_id})")
        
        except Exception as e:
            print(f"⚠️  User {user_data['email']} might already exist: {e}")
    
    return created_users

def setup_database_records(users):
    """Create database records for users"""
    client = get_supabase_client()
    
    print("\n📊 Setting up database records...")
    
    # Create kiosks first
    kiosks = [
        {
            'id': '550e8400-e29b-41d4-a716-446655440001',
            'name': 'Downtown Kiosk',
            'location': '123 Main St, City',
            'kiosk_code': 'KIOSK-001',
            'status': 'active'
        },
        {
            'id': '550e8400-e29b-41d4-a716-446655440002',
            'name': 'Airport Kiosk',
            'location': '456 Airport Rd, City',
            'kiosk_code': 'KIOSK-002',
            'status': 'active'
        }
    ]
    
    for kiosk in kiosks:
        try:
            client.table('kiosks').insert(kiosk).execute()
            print(f"✅ Created kiosk: {kiosk['name']}")
        except Exception as e:
            print(f"⚠️  Kiosk might already exist: {e}")
    
    # Create products
    products = [
        {'sku': 'PROD-001', 'name': 'Water Bottle', 'unit': 'unit', 'unit_price': 2.50, 'acquired_price': 1.50, 'suggested_price': 3.00},
        {'sku': 'PROD-002', 'name': 'Snack Bar', 'unit': 'unit', 'unit_price': 1.50, 'acquired_price': 0.75, 'suggested_price': 2.00},
        {'sku': 'PROD-003', 'name': 'Soda Can', 'unit': 'unit', 'unit_price': 2.00, 'acquired_price': 1.00, 'suggested_price': 2.50},
        {'sku': 'PROD-004', 'name': 'Chips', 'unit': 'unit', 'unit_price': 1.75, 'acquired_price': 0.90, 'suggested_price': 2.25},
        {'sku': 'PROD-005', 'name': 'Energy Drink', 'unit': 'unit', 'unit_price': 3.50, 'acquired_price': 2.00, 'suggested_price': 4.00}
    ]
    
    product_ids = {}
    for product in products:
        try:
            response = client.table('products').insert(product).execute()
            product_ids[product['sku']] = response.data[0]['id']
            print(f"✅ Created product: {product['name']}")
        except Exception as e:
            print(f"⚠️  Product might already exist: {e}")
    
    # Create user records and roles
    for email, user_info in users.items():
        user_id = user_info['user_id']
        role = user_info['role']
        
        try:
            # Insert into users table
            client.table('users').insert({
                'id': user_id,
                'email': email,
                'role': role
            }).execute()
            print(f"✅ Created user record for: {email}")
        except Exception as e:
            print(f"⚠️  User record might exist: {e}")
        
        try:
            # Insert into user_roles
            client.table('user_roles').insert({
                'user_id': user_id,
                'role': role
            }).execute()
            print(f"✅ Created role for: {email}")
        except Exception as e:
            print(f"⚠️  Role might exist: {e}")
        
        # Create profile with kiosk assignment
        if role == 'kiosk':
            kiosk_idx = 0 if 'kiosk1' in email else 1
            kiosk_id = kiosks[kiosk_idx]['id']
            
            try:
                client.table('profiles').insert({
                    'user_id': user_id,
                    'kiosk_id': kiosk_id,
                    'full_name': user_info['full_name'],
                    'email': email
                }).execute()
                print(f"✅ Created profile for: {email} (linked to {kiosks[kiosk_idx]['name']})")
            except Exception as e:
                print(f"⚠️  Profile might exist: {e}")
        
        # Create admin record with dummy wallet
        if role == 'admin':
            try:
                client.table('admins').insert({
                    'user_id': user_id,
                    'wallet_address': 'DEMO_WALLET_PLACEHOLDER'  # Will be replaced with real wallet later
                }).execute()
                print(f"✅ Created admin record for: {email}")
            except Exception as e:
                print(f"⚠️  Admin might exist: {e}")
            
            try:
                client.table('profiles').insert({
                    'user_id': user_id,
                    'full_name': user_info['full_name'],
                    'email': email
                }).execute()
                print(f"✅ Created profile for: {email}")
            except Exception as e:
                print(f"⚠️  Profile might exist: {e}")

def main():
    print("🚀 AKTA MMI - Demo Setup Script")
    print("=" * 60)
    
    try:
        # Create users
        users = create_demo_users()
        
        if users:
            # Setup database records
            setup_database_records(users)
            
            print("\n" + "=" * 60)
            print("✅ Demo setup complete!")
            print("\n📝 Demo Credentials:")
            print("-" * 60)
            print("Admin:")
            print("  Email: admin@akta-mmi.com")
            print("  Password: Admin123!")
            print("\nKiosk 1:")
            print("  Email: kiosk1@akta-mmi.com")
            print("  Password: Kiosk123!")
            print("\nKiosk 2:")
            print("  Email: kiosk2@akta-mmi.com")
            print("  Password: Kiosk123!")
            print("=" * 60)
        else:
            print("\n⚠️  No users were created. They might already exist.")
            print("Try logging in with the credentials above.")
    
    except Exception as e:
        print(f"\n❌ Error during setup: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
