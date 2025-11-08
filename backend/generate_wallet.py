"""
Generate Algorand wallet for TestNet
"""
from algosdk import account, mnemonic
import os
from pathlib import Path
from dotenv import load_dotenv, set_key

ROOT_DIR = Path(__file__).parent
env_file = ROOT_DIR / '.env'

def generate_algorand_wallet():
    """Generate new Algorand account"""
    print("🔑 Generating Algorand TestNet Wallet...")
    
    # Generate account
    private_key, address = account.generate_account()
    phrase = mnemonic.from_private_key(private_key)
    
    print(f"\n✅ Wallet Generated!")
    print(f"📍 Address: {address}")
    print(f"🔐 Mnemonic: {phrase}")
    print(f"\n⚠️  IMPORTANT: Store this mnemonic securely!")
    
    # Update .env file
    set_key(env_file, "DEPLOYER_MNEMONIC", phrase)
    
    print(f"\n✅ Updated .env with DEPLOYER_MNEMONIC")
    
    # Instructions for funding
    print("\n" + "="*60)
    print("📤 FUND YOUR WALLET (Required for TestNet):")
    print("="*60)
    print(f"\n1. Copy address: {address}")
    print(f"\n2. Go to: https://bank.testnet.algorand.network/")
    print(f"\n3. Paste address and click 'Dispense'")
    print(f"\n4. You'll receive 10 ALGO for testing")
    print("\n" + "="*60)
    
    return address, phrase

if __name__ == '__main__':
    generate_algorand_wallet()
