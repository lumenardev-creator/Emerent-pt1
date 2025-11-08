"""
Algorand blockchain adapter implementation
Hybrid approach: off-chain Ed25519 verification, on-chain attestation
"""
import os
import uuid
import base64
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime
from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod, indexer
from algosdk.future import transaction as future_transaction
import nacl.signing
import nacl.exceptions

from .adapter import ChainAdapter
from .types import ChainSubmission, SubmittedTx, OnChainTx
from utils.signatures import canonicalize_payload, hash_payload

class AlgorandHybridAdapter(ChainAdapter):
    """
    Algorand adapter with hybrid approach:
    - Ed25519 signature verification happens off-chain (faster, cheaper)
    - Transaction attestation recorded on-chain for immutability
    """
    
    def __init__(self):
        """Initialize Algorand client"""
        # Algod client (for submitting transactions)
        self.algod_address = os.environ.get('ALGOD_ADDRESS', 'https://testnet-api.algonode.cloud')
        self.algod_token = os.environ.get('ALGOD_TOKEN', '')
        self.algod_client = algod.AlgodClient(self.algod_token, self.algod_address)
        
        # Indexer client (for querying transactions)
        self.indexer_address = os.environ.get('ALGO_INDEXER_ADDRESS', 'https://testnet-idx.algonode.cloud')
        self.indexer_client = indexer.IndexerClient('', self.indexer_address)
        
        # Configuration
        self._chain_id = os.environ.get('CHAIN_ID', 'testnet')
        self.demo_mode = os.environ.get('DEMO_MODE', 'false').lower() == 'true'
        self.app_id = int(os.environ.get('APP_ID', '0')) if os.environ.get('APP_ID') else 0
        
        # Deployer account (for signing transactions)
        deployer_mnemonic = os.environ.get('DEPLOYER_MNEMONIC', '')
        if deployer_mnemonic:
            self.deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
            self.deployer_address = account.address_from_private_key(self.deployer_private_key)
        else:
            self.deployer_private_key = None
            self.deployer_address = None
    
    def name(self) -> str:
        """Return adapter name"""
        return "algorand"
    
    def chain_id(self) -> str:
        """Return chain ID"""
        return self._chain_id
    
    def build_submission(self, payload: Dict[str, Any]) -> ChainSubmission:
        """
        Build Algorand transaction for redistribution attestation
        
        In DEMO_MODE: Creates submission with placeholder
        In LIVE_MODE: Creates ApplicationCall transaction to smart contract
        """
        # Create canonical hash of payload for attestation
        payload_hash = hash_payload(payload)
        payload_hash_b64 = base64.b64encode(payload_hash).decode('utf-8')
        
        # Create note with metadata
        note_data = {
            'type': 'redistribution_attestation',
            'redistribution_id': payload.get('redistribution_id'),
            'hash': payload_hash_b64,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        note_bytes = canonicalize_payload(note_data)
        
        submission = ChainSubmission(
            payload=payload,
            metadata={
                'hash': payload_hash_b64,
                'note': note_data,
                'demo_mode': self.demo_mode
            }
        )
        
        # In demo mode, don't build actual transaction
        if self.demo_mode:
            return submission
        
        # In live mode, build ApplicationCall transaction
        if not self.deployer_private_key:
            raise Exception("DEPLOYER_MNEMONIC not configured")
        
        if self.app_id == 0:
            raise Exception("APP_ID not configured (smart contract not deployed)")
        
        # Get network parameters
        params = self.algod_client.suggested_params()
        
        # Build ApplicationCall transaction
        # For now, simple payment transaction with note
        # TODO: Replace with actual ApplicationCall when contract is deployed
        txn = transaction.PaymentTxn(
            sender=self.deployer_address,
            sp=params,
            receiver=self.deployer_address,
            amt=0,  # Zero amount, just for attestation
            note=note_bytes[:1024]  # Max 1KB note
        )
        
        # Sign transaction
        signed_txn = txn.sign(self.deployer_private_key)
        
        submission.signed_txn = signed_txn
        
        return submission
    
    def submit_transaction(self, submission: ChainSubmission) -> SubmittedTx:
        """
        Submit transaction to Algorand
        
        In DEMO_MODE: Returns fake txid
        In LIVE_MODE: Submits actual transaction
        """
        if self.demo_mode:
            # Generate fake txid for demo
            fake_txid = f"demo-{uuid.uuid4()}"
            return SubmittedTx(
                txid=fake_txid,
                chain=self.name(),
                chain_id=self.chain_id(),
                submitted_at=datetime.utcnow(),
                metadata={'demo_mode': True}
            )
        
        # Live mode: submit to network
        if not submission.signed_txn:
            raise Exception("Transaction not signed")
        
        try:
            txid = self.algod_client.send_transaction(submission.signed_txn)
            
            return SubmittedTx(
                txid=txid,
                chain=self.name(),
                chain_id=self.chain_id(),
                submitted_at=datetime.utcnow(),
                metadata=submission.metadata
            )
        
        except Exception as e:
            raise Exception(f"Failed to submit transaction: {str(e)}")
    
    def get_transaction(self, txid: str) -> Optional[OnChainTx]:
        """
        Query transaction from Algorand indexer
        
        In DEMO_MODE: Returns mock confirmed transaction
        In LIVE_MODE: Queries actual indexer
        """
        # Demo mode txids start with 'demo-'
        if txid.startswith('demo-'):
            # Return mock confirmed transaction
            return OnChainTx(
                txid=txid,
                status='confirmed',
                block=12345678,
                confirmed_round=12345678,
                fee=0.001,
                confirmed_at=datetime.utcnow(),
                metadata={'demo_mode': True}
            )
        
        # Live mode: query indexer
        try:
            response = self.indexer_client.transaction(txid)
            
            if not response or 'transaction' not in response:
                return None
            
            tx_data = response['transaction']
            
            # Check if confirmed
            confirmed = 'confirmed-round' in tx_data
            
            return OnChainTx(
                txid=txid,
                status='confirmed' if confirmed else 'pending',
                block=tx_data.get('confirmed-round'),
                confirmed_round=tx_data.get('confirmed-round'),
                fee=tx_data.get('fee', 0) / 1_000_000,  # Convert microAlgos to Algos
                confirmed_at=datetime.utcnow() if confirmed else None,
                metadata={'raw': tx_data}
            )
        
        except Exception as e:
            # Transaction not found or indexer error
            print(f"Error querying transaction {txid}: {e}")
            return None
    
    def verify_offchain_signature(
        self,
        message: bytes,
        signature: bytes,
        public_key: bytes
    ) -> bool:
        """
        Verify Ed25519 signature off-chain using PyNaCl
        """
        try:
            verify_key = nacl.signing.VerifyKey(public_key)
            verify_key.verify(message, signature)
            return True
        except (nacl.exceptions.BadSignatureError, Exception) as e:
            print(f"Signature verification failed: {e}")
            return False

# Factory function to get adapter instance
def get_adapter() -> ChainAdapter:
    """Get configured chain adapter"""
    chain = os.environ.get('CHAIN', 'algo')
    
    if chain == 'algo':
        return AlgorandHybridAdapter()
    else:
        raise Exception(f"Unsupported chain: {chain}")
