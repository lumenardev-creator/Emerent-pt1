"""
Type definitions for chain adapters
"""
from dataclasses import dataclass
from typing import Optional, Dict, Any
from datetime import datetime

@dataclass
class ChainSubmission:
    """Prepared blockchain submission"""
    payload: Dict[str, Any]
    signed_txn: Optional[bytes] = None
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class SubmittedTx:
    """Result of blockchain submission"""
    txid: str
    chain: str
    chain_id: str
    submitted_at: datetime
    metadata: Optional[Dict[str, Any]] = None

@dataclass
class OnChainTx:
    """Transaction data from blockchain"""
    txid: str
    status: str  # 'pending', 'confirmed', 'failed'
    block: Optional[int] = None
    confirmed_round: Optional[int] = None
    fee: Optional[float] = None
    confirmed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
