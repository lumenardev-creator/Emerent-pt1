"""
Pydantic models for request/response validation
"""
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    KIOSK = "kiosk"

class RedistributionStatus(str, Enum):
    REQUESTED = "requested"
    APPROVED = "approved"
    SUBMITTED = "submitted"
    FULFILLED = "fulfilled"
    RECONCILED = "reconciled"
    FAILED = "failed"
    TIMED_OUT = "timed_out"

class CommandStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUBMITTED = "submitted"
    COMPLETED = "completed"
    FAILED = "failed"

class TransactionStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    FAILED = "failed"

# Request Models

class RedistributionItem(BaseModel):
    sku: str
    quantity: int = Field(gt=0, description="Quantity must be positive")

class CreateRedistributionRequest(BaseModel):
    from_kiosk_id: str
    to_kiosk_id: str
    items: List[RedistributionItem]
    client_req_id: str
    signature: Optional[str] = Field(default="", description="Base64 encoded Ed25519 signature")
    public_key: Optional[str] = Field(default="", description="Base64 encoded Ed25519 public key")

class ApproveRedistributionRequest(BaseModel):
    admin_wallet: str = Field(description="Algorand wallet address")
    client_req_id: Optional[str] = None

# Response Models

class ApiResponse(BaseModel):
    status: str = Field(default="ok")
    data: Optional[Dict[str, Any]] = None
    error: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[Dict[str, Any]] = None

class RedistributionResponse(BaseModel):
    id: str
    from_kiosk_id: str
    to_kiosk_id: str
    status: RedistributionStatus
    items: List[Dict[str, Any]]
    pricing: Optional[Dict[str, Any]] = None
    blockchain_ref: Optional[str] = None
    txid: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

class CommandResponse(BaseModel):
    id: str
    status: CommandStatus
    redistribution_id: str
    txid: Optional[str] = None
    created_at: datetime
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

class TransactionResponse(BaseModel):
    txid: str
    chain: str
    chain_id: str
    status: TransactionStatus
    block: Optional[int] = None
    confirmed_round: Optional[int] = None
    fee: Optional[float] = None
    redistribution_id: str
    created_at: datetime
    confirmed_at: Optional[datetime] = None
    explorer_url: Optional[str] = None

class HealthResponse(BaseModel):
    service: str
    version: str
    database: str
    blockchain: str
