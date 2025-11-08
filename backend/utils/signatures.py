"""
Ed25519 signature verification utilities
"""
import base64
import nacl.signing
import nacl.exceptions
from typing import Optional
import json
import hashlib

def verify_ed25519_signature(
    message: bytes,
    signature_b64: str,
    public_key_b64: str
) -> bool:
    """
    Verify Ed25519 signature
    
    Args:
        message: Message bytes that were signed
        signature_b64: Base64 encoded signature
        public_key_b64: Base64 encoded public key
    
    Returns:
        True if signature is valid, False otherwise
    """
    try:
        # Decode base64
        signature = base64.b64decode(signature_b64)
        public_key_bytes = base64.b64decode(public_key_b64)
        
        # Create verify key
        verify_key = nacl.signing.VerifyKey(public_key_bytes)
        
        # Verify signature
        verify_key.verify(message, signature)
        
        return True
    
    except (nacl.exceptions.BadSignatureError, Exception) as e:
        print(f"Signature verification failed: {e}")
        return False

def canonicalize_payload(payload: dict) -> bytes:
    """
    Canonicalize payload for signing/verification
    Creates deterministic byte representation of payload
    
    Args:
        payload: Dictionary to canonicalize
    
    Returns:
        Canonical bytes representation
    """
    # Sort keys and create JSON string
    canonical_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    return canonical_json.encode('utf-8')

def hash_payload(payload: dict) -> bytes:
    """
    Create SHA-256 hash of payload for blockchain attestation
    
    Args:
        payload: Dictionary to hash
    
    Returns:
        SHA-256 hash bytes
    """
    canonical_bytes = canonicalize_payload(payload)
    return hashlib.sha256(canonical_bytes).digest()

def verify_redistribution_signature(
    redistribution_data: dict,
    signature_b64: str,
    public_key_b64: str
) -> bool:
    """
    Verify signature for redistribution request
    
    Args:
        redistribution_data: Redistribution request data
        signature_b64: Base64 encoded signature
        public_key_b64: Base64 encoded public key
    
    Returns:
        True if signature is valid
    """
    # Create canonical message
    message = canonicalize_payload(redistribution_data)
    
    # Verify signature
    return verify_ed25519_signature(message, signature_b64, public_key_b64)
