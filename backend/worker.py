"""
Worker Process for Blockchain Command Processing
Handles:
- Polling pending commands
- Signature verification
- Blockchain submission via adapter
- Fulfillment simulation (30s delay)
- Inventory updates
"""
import os
import sys
import time
import asyncio
import logging
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dao import CommandDAO, RedistributionDAO, TransactionDAO, KioskDAO
from chain.algorand_adapter import get_adapter
from utils.signatures import verify_redistribution_signature, canonicalize_payload

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
POLL_INTERVAL = int(os.environ.get('WORKER_POLL_INTERVAL', '5'))  # seconds
FULFILLMENT_DELAY = int(os.environ.get('FULFILLMENT_SIM_SECONDS', '30'))  # seconds
MAX_RETRIES = int(os.environ.get('WORKER_MAX_RETRIES', '3'))

def process_command(command):
    """
    Process a single blockchain command
    
    Steps:
    1. Verify signature (off-chain)
    2. Build blockchain submission via adapter
    3. Submit transaction to Algorand
    4. Persist txid
    5. Simulate fulfillment (wait 30s)
    6. Update inventory
    7. Mark as completed
    """
    command_id = command['id']
    redistribution_id = command['redistribution_id']
    
    logger.info(f"Processing command {command_id} for redistribution {redistribution_id}")
    
    try:
        # Update status to processing
        CommandDAO.update(command_id, {'status': 'processing'})
        
        # Get adapter
        adapter = get_adapter()
        
        # Verify signature (if present)
        payload = command['payload']
        if payload.get('signature') and payload.get('public_key'):
            logger.info(f"Verifying signature for command {command_id}")
            
            # Create canonical message
            message_data = {
                'from_kiosk_id': payload['from_kiosk_id'],
                'to_kiosk_id': payload['to_kiosk_id'],
                'items': payload['items']
            }
            message = canonicalize_payload(message_data)
            
            import base64
            signature = base64.b64decode(payload['signature'])
            public_key = base64.b64decode(payload['public_key'])
            
            if not adapter.verify_offchain_signature(message, signature, public_key):
                raise Exception("Invalid signature")
            
            logger.info(f"Signature verified for command {command_id}")
        
        # Build blockchain submission
        logger.info(f"Building blockchain submission for command {command_id}")
        submission = adapter.build_submission(payload)
        
        # Submit to blockchain
        logger.info(f"Submitting transaction to blockchain for command {command_id}")
        submitted_tx = adapter.submit_transaction(submission)
        
        txid = submitted_tx.txid
        blockchain_ref = f"{adapter.name()}:{adapter.chain_id()}:{txid}"
        
        logger.info(f"Transaction submitted: {txid}")
        
        # Create transaction record
        TransactionDAO.create({
            'command_id': command_id,
            'redistribution_id': redistribution_id,
            'txid': txid,
            'chain': adapter.name(),
            'chain_id': adapter.chain_id(),
            'blockchain_ref': blockchain_ref
        })
        
        # Update command status
        CommandDAO.update(command_id, {
            'status': 'submitted',
            'processed_at': datetime.utcnow().isoformat()
        })
        
        # Update redistribution with blockchain reference
        RedistributionDAO.update(redistribution_id, {
            'status': 'submitted',
            'blockchain_ref': blockchain_ref,
            'txid': txid
        })
        
        logger.info(f"Command {command_id} submitted successfully, txid: {txid}")
        
        # Simulate fulfillment (30 second delay)
        logger.info(f"Waiting {FULFILLMENT_DELAY}s for fulfillment simulation...")
        time.sleep(FULFILLMENT_DELAY)
        
        # Update inventory
        logger.info(f"Updating inventory for redistribution {redistribution_id}")
        
        redistribution = RedistributionDAO.get_by_id(redistribution_id)
        from_kiosk_id = redistribution['from_kiosk_id']
        to_kiosk_id = redistribution['to_kiosk_id']
        items = redistribution['items']
        
        # Update inventory for each item
        for item in items:
            sku = item['sku']
            quantity = item['quantity']
            
            # Decrement from source kiosk
            try:
                # Get product_id from SKU
                from supabase import create_client
                client = create_client(
                    os.environ['SUPABASE_URL'],
                    os.environ['SUPABASE_SERVICE_KEY']
                )
                
                # Get product_id
                product_response = client.table('products').select('id').eq('sku', sku).single().execute()
                product_id = product_response.data['id']
                
                # Update from_kiosk inventory (decrement)
                from_inv_response = client.table('kiosk_inventory').select('quantity').eq('kiosk_id', from_kiosk_id).eq('product_id', product_id).single().execute()
                if from_inv_response.data:
                    current_qty = from_inv_response.data['quantity']
                    new_qty = max(0, current_qty - quantity)
                    client.table('kiosk_inventory').update({
                        'quantity': new_qty,
                        'last_updated': datetime.utcnow().isoformat()
                    }).eq('kiosk_id', from_kiosk_id).eq('product_id', product_id).execute()
                    
                    logger.info(f"Decremented {sku} from {from_kiosk_id}: {current_qty} -> {new_qty}")
                
                # Update to_kiosk inventory (increment)
                to_inv_response = client.table('kiosk_inventory').select('quantity').eq('kiosk_id', to_kiosk_id).eq('product_id', product_id).single().execute()
                if to_inv_response.data:
                    current_qty = to_inv_response.data['quantity']
                    new_qty = current_qty + quantity
                    client.table('kiosk_inventory').update({
                        'quantity': new_qty,
                        'last_updated': datetime.utcnow().isoformat()
                    }).eq('kiosk_id', to_kiosk_id).eq('product_id', product_id).execute()
                    
                    logger.info(f"Incremented {sku} to {to_kiosk_id}: {current_qty} -> {new_qty}")
                else:
                    # Create new inventory entry if doesn't exist
                    client.table('kiosk_inventory').insert({
                        'kiosk_id': to_kiosk_id,
                        'product_id': product_id,
                        'quantity': quantity,
                        'threshold': 20
                    }).execute()
                    logger.info(f"Created inventory for {sku} in {to_kiosk_id}: {quantity}")
                
            except Exception as e:
                logger.error(f"Error updating inventory for {sku}: {e}")
                raise
        
        # Mark redistribution as fulfilled
        RedistributionDAO.update(redistribution_id, {
            'status': 'fulfilled',
            'completed_at': datetime.utcnow().isoformat()
        })
        
        # Mark command as completed
        CommandDAO.update(command_id, {
            'status': 'completed'
        })
        
        logger.info(f"Command {command_id} completed successfully!")
        
    except Exception as e:
        logger.error(f"Error processing command {command_id}: {e}")
        
        # Update command with error
        CommandDAO.update(command_id, {
            'status': 'failed',
            'error_message': str(e)
        })
        
        # Update redistribution
        RedistributionDAO.update(redistribution_id, {
            'status': 'failed'
        })

def worker_loop():
    """Main worker loop"""
    logger.info("Worker started, polling for pending commands...")
    logger.info(f"Poll interval: {POLL_INTERVAL}s, Fulfillment delay: {FULFILLMENT_DELAY}s")
    
    while True:
        try:
            # Get pending commands
            pending_commands = CommandDAO.get_pending()
            
            if pending_commands:
                logger.info(f"Found {len(pending_commands)} pending command(s)")
                
                for command in pending_commands:
                    process_command(command)
            
            # Sleep before next poll
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in worker loop: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    logger.info("="*60)
    logger.info("AKTA MMI - Blockchain Worker")
    logger.info("="*60)
    worker_loop()
