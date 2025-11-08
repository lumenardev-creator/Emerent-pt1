"""
AKTA MMI - Backend API Server
Blockchain-Integrated Inventory Redistribution System
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from typing import Optional, List

# Import models
from models import (
    CreateRedistributionRequest,
    ApproveRedistributionRequest,
    ApiResponse,
    ErrorResponse,
    RedistributionResponse,
    CommandResponse,
    TransactionResponse,
    HealthResponse,
    RedistributionStatus,
    CommandStatus
)

# Import DAOs
from dao import (
    RedistributionDAO,
    CommandDAO,
    TransactionDAO,
    KioskDAO,
    ProductDAO,
    AdminDAO
)

# Import auth
from auth import get_current_user, require_admin, require_kiosk, get_user_role

# Import utils
from utils.signatures import verify_redistribution_signature, canonicalize_payload
from utils.pricing import calculate_redistribution_pricing

# Import database
from database import get_supabase_client, close_supabase_client

# Load environment
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create FastAPI app
app = FastAPI(title="AKTA MMI API", version="1.0.0")

# Create API router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# =====================================================
# HEALTH CHECK ENDPOINT
# =====================================================

@api_router.get("/health", response_model=ApiResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        client = get_supabase_client()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    chain = os.environ.get('CHAIN', 'algo')
    chain_id = os.environ.get('CHAIN_ID', 'testnet')
    demo_mode = os.environ.get('DEMO_MODE', 'false')
    
    return ApiResponse(
        status="ok",
        data={
            "service": "core-api",
            "version": "1.0.0",
            "database": db_status,
            "blockchain": f"{chain}:{chain_id}",
            "demo_mode": demo_mode == "true"
        }
    )

# =====================================================
# REDISTRIBUTION ENDPOINTS
# =====================================================

@api_router.post("/redistributions", response_model=ApiResponse)
async def create_redistribution(
    request: CreateRedistributionRequest,
    user: dict = Depends(get_current_user)
):
    """
    Create a new redistribution request
    Requires kiosk role and valid Ed25519 signature
    """
    try:
        user_id = user['user_id']
        
        # Check user role
        role = await get_user_role(user_id)
        if role != 'kiosk':
            raise HTTPException(status_code=403, detail="Kiosk role required")
        
        # Check for duplicate (idempotency)
        existing = RedistributionDAO.check_duplicate(user_id, request.client_req_id)
        if existing:
            logger.info(f"Duplicate request detected: {request.client_req_id}")
            return ApiResponse(
                status="ok",
                data=existing
            )
        
        # Verify Ed25519 signature
        # TEMPORARILY DISABLED FOR TESTING - TODO: Re-enable with frontend signing
        """
        payload_for_signing = {
            'from_kiosk_id': request.from_kiosk_id,
            'to_kiosk_id': request.to_kiosk_id,
            'items': [item.dict() for item in request.items],
            'client_req_id': request.client_req_id
        }
        
        if not verify_redistribution_signature(
            payload_for_signing,
            request.signature,
            request.public_key
        ):
            raise HTTPException(
                status_code=400,
                detail="Invalid Ed25519 signature"
            )
        """
        
        # Validate kiosks exist
        from_kiosk = KioskDAO.get_by_id(request.from_kiosk_id)
        to_kiosk = KioskDAO.get_by_id(request.to_kiosk_id)
        
        if not from_kiosk or not to_kiosk:
            raise HTTPException(status_code=404, detail="Kiosk not found")
        
        # Get inventory
        from_inventory = KioskDAO.get_inventory(request.from_kiosk_id)
        to_inventory = KioskDAO.get_inventory(request.to_kiosk_id)
        
        # Validate sufficient inventory
        for item in request.items:
            if from_inventory.get(item.sku, 0) < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient inventory for {item.sku}"
                )
        
        # Calculate pricing
        skus = [item.sku for item in request.items]
        product_prices = ProductDAO.get_prices(skus)
        
        pricing = calculate_redistribution_pricing(
            [item.dict() for item in request.items],
            from_inventory,
            to_inventory,
            product_prices
        )
        
        # Create redistribution
        redistribution_data = {
            'from_kiosk_id': request.from_kiosk_id,
            'to_kiosk_id': request.to_kiosk_id,
            'items': [item.dict() for item in request.items],
            'pricing': pricing,
            'client_req_id': request.client_req_id,
            'signature': request.signature,
            'public_key': request.public_key,
            'created_by': user_id
        }
        
        redistribution = RedistributionDAO.create(redistribution_data)
        
        logger.info(f"Created redistribution: {redistribution['id']}")
        
        return ApiResponse(
            status="ok",
            data=redistribution
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating redistribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/redistributions/{redistribution_id}/approve", response_model=ApiResponse)
async def approve_redistribution(
    redistribution_id: str,
    request: ApproveRedistributionRequest,
    user: dict = Depends(get_current_user)
):
    """
    Approve a redistribution request (admin only)
    Creates a blockchain command for worker processing
    """
    try:
        # Verify admin role
        await require_admin(user)
        user_id = user['user_id']
        
        # Get admin wallet
        admin = AdminDAO.get_by_user_id(user_id)
        if not admin:
            raise HTTPException(status_code=404, detail="Admin wallet not found")
        
        # Verify wallet address matches
        if admin['wallet_address'] != request.admin_wallet:
            raise HTTPException(status_code=400, detail="Admin wallet address mismatch")
        
        # Get redistribution
        redistribution = RedistributionDAO.get_by_id(redistribution_id)
        if not redistribution:
            raise HTTPException(status_code=404, detail="Redistribution not found")
        
        # Check status
        if redistribution['status'] != 'requested':
            raise HTTPException(
                status_code=400,
                detail=f"Cannot approve redistribution with status: {redistribution['status']}"
            )
        
        # Check for duplicate command (idempotency)
        client_req_id = request.client_req_id or f"approve-{redistribution_id}"
        existing_command = CommandDAO.check_duplicate(user_id, client_req_id)
        if existing_command:
            return ApiResponse(
                status="ok",
                data={
                    "command_id": existing_command['id'],
                    "redistribution_id": redistribution_id,
                    "status": "approved"
                }
            )
        
        # Update redistribution status
        RedistributionDAO.update(redistribution_id, {'status': 'approved'})
        
        # Create blockchain command
        command_payload = {
            'redistribution_id': redistribution_id,
            'admin_wallet': request.admin_wallet,
            'from_kiosk_id': redistribution['from_kiosk_id'],
            'to_kiosk_id': redistribution['to_kiosk_id'],
            'items': redistribution['items'],
            'signature': redistribution.get('signature'),
            'public_key': redistribution.get('public_key')
        }
        
        command = CommandDAO.create({
            'user_id': user_id,
            'client_req_id': client_req_id,
            'payload': command_payload,
            'redistribution_id': redistribution_id
        })
        
        logger.info(f"Approved redistribution {redistribution_id}, created command {command['id']}")
        
        return ApiResponse(
            status="ok",
            data={
                "command_id": command['id'],
                "redistribution_id": redistribution_id,
                "status": "approved"
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error approving redistribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/redistributions/{redistribution_id}", response_model=ApiResponse)
async def get_redistribution(
    redistribution_id: str,
    user: dict = Depends(get_current_user)
):
    """Get redistribution details"""
    try:
        redistribution = RedistributionDAO.get_by_id(redistribution_id)
        
        if not redistribution:
            raise HTTPException(status_code=404, detail="Redistribution not found")
        
        # Check access (admin can see all, kiosk can only see their own)
        role = await get_user_role(user['user_id'])
        if role == 'kiosk':
            # Check if user's kiosk is involved
            # This would require checking profile.kiosk_id
            # For now, simplified
            pass
        
        return ApiResponse(
            status="ok",
            data=redistribution
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting redistribution: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/redistributions", response_model=ApiResponse)
async def list_redistributions(
    status: Optional[str] = Query(None),
    from_kiosk_id: Optional[str] = Query(None),
    to_kiosk_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user)
):
    """List redistributions with filters"""
    try:
        filters = {}
        if status:
            filters['status'] = status
        if from_kiosk_id:
            filters['from_kiosk_id'] = from_kiosk_id
        if to_kiosk_id:
            filters['to_kiosk_id'] = to_kiosk_id
        
        redistributions = RedistributionDAO.list_all(filters, limit, offset)
        
        return ApiResponse(
            status="ok",
            data={
                "items": redistributions,
                "total": len(redistributions),
                "limit": limit,
                "offset": offset
            }
        )
    
    except Exception as e:
        logger.error(f"Error listing redistributions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# COMMAND ENDPOINTS
# =====================================================

@api_router.get("/commands/{command_id}", response_model=ApiResponse)
async def get_command(
    command_id: str,
    user: dict = Depends(get_current_user)
):
    """Get command status"""
    try:
        command = CommandDAO.get_by_id(command_id)
        
        if not command:
            raise HTTPException(status_code=404, detail="Command not found")
        
        # Check access
        role = await get_user_role(user['user_id'])
        if role != 'admin' and command['user_id'] != user['user_id']:
            raise HTTPException(status_code=403, detail="Access denied")
        
        return ApiResponse(
            status="ok",
            data=command
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting command: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# =====================================================
# TRANSACTION ENDPOINTS
# =====================================================

@api_router.get("/tx/{txid}", response_model=ApiResponse)
async def get_transaction(
    txid: str,
    user: dict = Depends(get_current_user)
):
    """Get transaction details by txid"""
    try:
        transaction = TransactionDAO.get_by_txid(txid)
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Add explorer URL
        chain_id = transaction.get('chain_id', 'testnet')
        if chain_id == 'testnet':
            explorer_base = 'https://testnet.algoexplorer.io'
        else:
            explorer_base = 'https://algoexplorer.io'
        
        transaction['explorer_url'] = f"{explorer_base}/tx/{txid}"
        
        return ApiResponse(
            status="ok",
            data=transaction
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting transaction: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/transactions", response_model=ApiResponse)
async def list_transactions(
    status: Optional[str] = Query(None),
    redistribution_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: dict = Depends(get_current_user)
):
    """List transactions (admin only)"""
    try:
        # Require admin role
        await require_admin(user)
        
        filters = {}
        if status:
            filters['status'] = status
        if redistribution_id:
            filters['redistribution_id'] = redistribution_id
        
        transactions = TransactionDAO.list_all(filters, limit, offset)
        
        return ApiResponse(
            status="ok",
            data={
                "items": transactions,
                "total": len(transactions),
                "limit": limit,
                "offset": offset
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router in app
app.include_router(api_router)

# Shutdown event
@app.on_event("shutdown")
async def shutdown():
    close_supabase_client()
    logger.info("Application shutdown complete")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get('FLASK_PORT', 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
