"""
Reconciler Process for Transaction Confirmation
Polls pending blockchain transactions and updates status when confirmed
"""
import os
import sys
import time
import logging
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from dao import TransactionDAO, RedistributionDAO
from chain.algorand_adapter import get_adapter

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
POLL_INTERVAL = int(os.environ.get('RECONCILER_POLL_INTERVAL', '30'))  # seconds

def reconcile_transaction(transaction):
    """
    Reconcile a single transaction by querying the blockchain
    """
    txid = transaction['txid']
    redistribution_id = transaction['redistribution_id']
    
    logger.info(f"Reconciling transaction {txid}")
    
    try:
        # Get adapter
        adapter = get_adapter()
        
        # Query blockchain for transaction
        on_chain_tx = adapter.get_transaction(txid)
        
        if not on_chain_tx:
            logger.warning(f"Transaction {txid} not found on blockchain yet")
            return
        
        if on_chain_tx.status == 'confirmed':
            logger.info(f"Transaction {txid} confirmed at round {on_chain_tx.confirmed_round}")
            
            # Update transaction status
            TransactionDAO.update(txid, {
                'status': 'confirmed',
                'block': on_chain_tx.block,
                'confirmed_round': on_chain_tx.confirmed_round,
                'fee': on_chain_tx.fee,
                'confirmed_at': datetime.utcnow().isoformat()
            })
            
            # Update redistribution status to reconciled
            RedistributionDAO.update(redistribution_id, {
                'status': 'reconciled'
            })
            
            logger.info(f"Redistribution {redistribution_id} reconciled successfully")
            
        elif on_chain_tx.status == 'failed':
            logger.error(f"Transaction {txid} failed on blockchain")
            
            TransactionDAO.update(txid, {
                'status': 'failed'
            })
            
            RedistributionDAO.update(redistribution_id, {
                'status': 'failed'
            })
        
    except Exception as e:
        logger.error(f"Error reconciling transaction {txid}: {e}")

def reconciler_loop():
    """Main reconciler loop"""
    logger.info("Reconciler started, polling for pending transactions...")
    logger.info(f"Poll interval: {POLL_INTERVAL}s")
    
    while True:
        try:
            # Get pending transactions
            pending_txs = TransactionDAO.get_pending()
            
            if pending_txs:
                logger.info(f"Found {len(pending_txs)} pending transaction(s)")
                
                for tx in pending_txs:
                    reconcile_transaction(tx)
            
            # Sleep before next poll
            time.sleep(POLL_INTERVAL)
            
        except KeyboardInterrupt:
            logger.info("Reconciler stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in reconciler loop: {e}")
            time.sleep(POLL_INTERVAL)

if __name__ == '__main__':
    logger.info("="*60)
    logger.info("AKTA MMI - Blockchain Reconciler")
    logger.info("="*60)
    reconciler_loop()
