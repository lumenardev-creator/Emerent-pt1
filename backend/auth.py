"""
Authentication middleware for JWT verification
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os
from typing import Optional, Dict
from database import get_supabase_client

security = HTTPBearer()

def get_jwt_secret() -> str:
    """Get JWT secret from Supabase"""
    # Supabase uses the project's JWT secret
    # Extract from service key or use env var
    return os.environ.get('SUPABASE_JWT_SECRET', '')

async def verify_token(credentials: HTTPAuthorizationCredentials) -> Dict:
    """
    Verify JWT token from Supabase Auth
    Returns decoded token with user info
    """
    token = credentials.credentials
    
    try:
        # Verify token using Supabase
        client = get_supabase_client()
        
        # Get user from token
        user_response = client.auth.get_user(token)
        
        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = user_response.user
        
        return {
            "user_id": user.id,
            "email": user.email,
            "token": token
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}"
        )

async def get_current_user(credentials: HTTPAuthorizationCredentials = security) -> Dict:
    """
    Dependency to get current authenticated user
    """
    return await verify_token(credentials)

async def get_user_role(user_id: str) -> Optional[str]:
    """
    Get user role from database
    """
    client = get_supabase_client()
    
    response = client.table('user_roles').select('role').eq('user_id', user_id).execute()
    
    if response.data and len(response.data) > 0:
        return response.data[0]['role']
    
    return None

async def require_admin(user: Dict = None) -> Dict:
    """
    Dependency to require admin role
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    role = await get_user_role(user['user_id'])
    
    if role != 'admin':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    
    return user

async def require_kiosk(user: Dict = None) -> Dict:
    """
    Dependency to require kiosk role
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    role = await get_user_role(user['user_id'])
    
    if role != 'kiosk':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kiosk access required"
        )
    
    return user
