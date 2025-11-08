"""
Abstract base class for blockchain adapters
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from .chain_types import ChainSubmission, SubmittedTx, OnChainTx

class ChainAdapter(ABC):
    """Abstract blockchain adapter interface"""
    
    @abstractmethod
    def name(self) -> str:
        """Return adapter name (e.g., 'algorand')"""
        pass
    
    @abstractmethod
    def chain_id(self) -> str:
        """Return chain ID (e.g., 'testnet', 'mainnet')"""
        pass
    
    @abstractmethod
    def build_submission(self, payload: Dict[str, Any]) -> ChainSubmission:
        """
        Build blockchain submission from payload
        
        Args:
            payload: Redistribution data to attest
        
        Returns:
            ChainSubmission ready for submission
        """
        pass
    
    @abstractmethod
    def submit_transaction(self, submission: ChainSubmission) -> SubmittedTx:
        """
        Submit transaction to blockchain
        
        Args:
            submission: Prepared submission
        
        Returns:
            SubmittedTx with transaction ID
        
        Raises:
            Exception if submission fails
        """
        pass
    
    @abstractmethod
    def get_transaction(self, txid: str) -> Optional[OnChainTx]:
        """
        Query transaction status from blockchain
        
        Args:
            txid: Transaction ID
        
        Returns:
            OnChainTx if found, None otherwise
        """
        pass
    
    @abstractmethod
    def verify_offchain_signature(
        self,
        message: bytes,
        signature: bytes,
        public_key: bytes
    ) -> bool:
        """
        Verify Ed25519 signature off-chain
        
        Args:
            message: Message bytes
            signature: Signature bytes
            public_key: Public key bytes
        
        Returns:
            True if valid, False otherwise
        """
        pass
