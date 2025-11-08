"""
Data Access Object layer for database operations
"""
from database import get_supabase_client
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class RedistributionDAO:
    """Data access for redistributions"""
    
    @staticmethod
    def create(data: Dict[str, Any]) -> Dict:
        """Create new redistribution"""
        client = get_supabase_client()
        
        redistribution = {
            'id': str(uuid.uuid4()),
            'from_kiosk_id': data['from_kiosk_id'],
            'to_kiosk_id': data['to_kiosk_id'],
            'items': data['items'],
            'pricing': data.get('pricing'),
            'client_req_id': data['client_req_id'],
            'signature': data.get('signature'),
            'public_key': data.get('public_key'),
            'created_by': data['created_by'],
            'status': 'requested',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        response = client.table('redistributions').insert(redistribution).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_id(redistribution_id: str) -> Optional[Dict]:
        """Get redistribution by ID"""
        client = get_supabase_client()
        response = client.table('redistributions').select('*').eq('id', redistribution_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update(redistribution_id: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Update redistribution"""
        client = get_supabase_client()
        data['updated_at'] = datetime.utcnow().isoformat()
        response = client.table('redistributions').update(data).eq('id', redistribution_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def list_all(filters: Optional[Dict] = None, limit: int = 50, offset: int = 0) -> List[Dict]:
        """List redistributions with filters"""
        client = get_supabase_client()
        query = client.table('redistributions').select('*')
        
        if filters:
            if 'status' in filters:
                query = query.eq('status', filters['status'])
            if 'from_kiosk_id' in filters:
                query = query.eq('from_kiosk_id', filters['from_kiosk_id'])
            if 'to_kiosk_id' in filters:
                query = query.eq('to_kiosk_id', filters['to_kiosk_id'])
        
        query = query.limit(limit).offset(offset).order('created_at', desc=True)
        response = query.execute()
        return response.data if response.data else []
    
    @staticmethod
    def check_duplicate(user_id: str, client_req_id: str) -> Optional[Dict]:
        """Check for duplicate request (idempotency)"""
        client = get_supabase_client()
        response = client.table('redistributions').select('*').eq('created_by', user_id).eq('client_req_id', client_req_id).execute()
        return response.data[0] if response.data else None

class CommandDAO:
    """Data access for blockchain commands"""
    
    @staticmethod
    def create(data: Dict[str, Any]) -> Dict:
        """Create new command"""
        client = get_supabase_client()
        
        command = {
            'id': str(uuid.uuid4()),
            'user_id': data['user_id'],
            'client_req_id': data.get('client_req_id', str(uuid.uuid4())),
            'command_type': 'approve_redistribution',
            'payload': data['payload'],
            'redistribution_id': data['redistribution_id'],
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        response = client.table('blockchain_commands').insert(command).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_id(command_id: str) -> Optional[Dict]:
        """Get command by ID"""
        client = get_supabase_client()
        response = client.table('blockchain_commands').select('*').eq('id', command_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update(command_id: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Update command"""
        client = get_supabase_client()
        data['updated_at'] = datetime.utcnow().isoformat()
        response = client.table('blockchain_commands').update(data).eq('id', command_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_pending() -> List[Dict]:
        """Get all pending commands for worker processing"""
        client = get_supabase_client()
        response = client.table('blockchain_commands').select('*').eq('status', 'pending').order('created_at').execute()
        return response.data if response.data else []
    
    @staticmethod
    def check_duplicate(user_id: str, client_req_id: str) -> Optional[Dict]:
        """Check for duplicate command (idempotency)"""
        client = get_supabase_client()
        response = client.table('blockchain_commands').select('*').eq('user_id', user_id).eq('client_req_id', client_req_id).execute()
        return response.data[0] if response.data else None

class TransactionDAO:
    """Data access for blockchain transactions"""
    
    @staticmethod
    def create(data: Dict[str, Any]) -> Dict:
        """Create new transaction record"""
        client = get_supabase_client()
        
        transaction = {
            'id': str(uuid.uuid4()),
            'command_id': data['command_id'],
            'redistribution_id': data['redistribution_id'],
            'txid': data['txid'],
            'chain': data.get('chain', 'algorand'),
            'chain_id': data.get('chain_id', 'testnet'),
            'blockchain_ref': data['blockchain_ref'],
            'status': 'pending',
            'created_at': datetime.utcnow().isoformat()
        }
        
        response = client.table('blockchain_txns').insert(transaction).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_by_txid(txid: str) -> Optional[Dict]:
        """Get transaction by txid"""
        client = get_supabase_client()
        response = client.table('blockchain_txns').select('*').eq('txid', txid).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update(txid: str, data: Dict[str, Any]) -> Optional[Dict]:
        """Update transaction"""
        client = get_supabase_client()
        response = client.table('blockchain_txns').update(data).eq('txid', txid).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def list_all(filters: Optional[Dict] = None, limit: int = 50, offset: int = 0) -> List[Dict]:
        """List transactions with filters"""
        client = get_supabase_client()
        query = client.table('blockchain_txns').select('*')
        
        if filters:
            if 'status' in filters:
                query = query.eq('status', filters['status'])
            if 'redistribution_id' in filters:
                query = query.eq('redistribution_id', filters['redistribution_id'])
        
        query = query.limit(limit).offset(offset).order('created_at', desc=True)
        response = query.execute()
        return response.data if response.data else []
    
    @staticmethod
    def get_pending() -> List[Dict]:
        """Get all pending transactions for reconciliation"""
        client = get_supabase_client()
        response = client.table('blockchain_txns').select('*').eq('status', 'pending').order('created_at').execute()
        return response.data if response.data else []

class KioskDAO:
    """Data access for kiosks"""
    
    @staticmethod
    def get_by_id(kiosk_id: str) -> Optional[Dict]:
        """Get kiosk by ID"""
        client = get_supabase_client()
        response = client.table('kiosks').select('*').eq('id', kiosk_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_inventory(kiosk_id: str) -> Dict:
        """Get kiosk inventory"""
        client = get_supabase_client()
        response = client.table('kiosk_inventory').select('*, products(*)').eq('kiosk_id', kiosk_id).execute()
        
        inventory = {}
        if response.data:
            for item in response.data:
                sku = item['products']['sku']
                inventory[sku] = item['quantity']
        
        return inventory
    
    @staticmethod
    def update_inventory(kiosk_id: str, sku: str, quantity_change: int) -> bool:
        """Update inventory quantity (increment or decrement)"""
        client = get_supabase_client()
        
        # Get current quantity
        response = client.table('kiosk_inventory').select('quantity, product_id').eq('kiosk_id', kiosk_id).eq('products.sku', sku).execute()
        
        if not response.data:
            return False
        
        current_qty = response.data[0]['quantity']
        new_qty = current_qty + quantity_change
        
        if new_qty < 0:
            raise ValueError(f"Insufficient inventory for {sku}")
        
        # Update quantity
        update_response = client.table('kiosk_inventory').update({
            'quantity': new_qty,
            'last_updated': datetime.utcnow().isoformat()
        }).eq('kiosk_id', kiosk_id).eq('products.sku', sku).execute()
        
        return True

class ProductDAO:
    """Data access for products"""
    
    @staticmethod
    def get_by_sku(sku: str) -> Optional[Dict]:
        """Get product by SKU"""
        client = get_supabase_client()
        response = client.table('products').select('*').eq('sku', sku).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def get_prices(skus: List[str]) -> Dict[str, Dict]:
        """Get pricing for multiple SKUs"""
        client = get_supabase_client()
        response = client.table('products').select('sku, acquired_price, suggested_price').in_('sku', skus).execute()
        
        prices = {}
        if response.data:
            for product in response.data:
                prices[product['sku']] = {
                    'acquired_price': product.get('acquired_price', 0),
                    'suggested_price': product.get('suggested_price', 0)
                }
        
        return prices

class AdminDAO:
    """Data access for admins"""
    
    @staticmethod
    def get_by_user_id(user_id: str) -> Optional[Dict]:
        """Get admin by user_id"""
        client = get_supabase_client()
        response = client.table('admins').select('*').eq('user_id', user_id).execute()
        return response.data[0] if response.data else None
