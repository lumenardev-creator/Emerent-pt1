"""
Fund wallet from TestNet faucet
"""
import requests
import os
from pathlib import Path
from dotenv import load_dotenv
from algosdk import mnemonic, account
from algosdk.v2client import algod

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

def get_address_from_mnemonic():
    """Get address from mnemonic in .env"""
    phrase = os.environ.get('DEPLOYER_MNEMONIC')
    if not phrase:
        raise Exception("DEPLOYER_MNEMONIC not found in .env")
    
    private_key = mnemonic.to_private_key(phrase)
    address = account.address_from_private_key(private_key)
    return address

def fund_from_faucet(address):
    """Request funds from TestNet faucet"""
    print(f"💰 Requesting funds for: {address}")
    
    try:
        response = requests.post(
            'https://bank.testnet.algorand.network/',
            data={'account': address},
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Successfully requested funds from faucet!")
            print("⏳ Wait 10-20 seconds for funds to arrive...")
            return True
        else:
            print(f"⚠️  Faucet request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    
    except Exception as e:
        print(f"❌ Error requesting funds: {e}")
        return False

def check_balance(address):
    """Check account balance"""
    algod_address = os.environ.get('ALGOD_ADDRESS', 'https://testnet-api.algonode.cloud')
    algod_token = os.environ.get('ALGOD_TOKEN', '')
    
    client = algod.AlgodClient(algod_token, algod_address)
    
    try:
        account_info = client.account_info(address)
        balance = account_info['amount'] / 1_000_000  # Convert microAlgos to Algos
        print(f"💰 Current Balance: {balance} ALGO")
        return balance
    except Exception as e:
        print(f"⚠️  Could not check balance: {e}")
        return 0

if __name__ == '__main__':
    print("🚀 Funding Algorand TestNet Wallet")
    print("="*60)
    
    address = get_address_from_mnemonic()
    print(f"📍 Wallet Address: {address}\n")
    
    # Check current balance
    initial_balance = check_balance(address)
    
    if initial_balance > 0:
        print("\n✅ Wallet already has funds!")
    else:
        # Request funds
        fund_from_faucet(address)
        
        # Wait and check again
        import time
        time.sleep(15)
        print("\n🔍 Checking balance...")
        final_balance = check_balance(address)
        
        if final_balance > 0:
            print("\n✅ Wallet funded successfully!")
        else:
            print("\n⚠️  Funds not received yet. Try checking again in a few minutes.")
            print(f"Manual check: https://testnet.algoexplorer.io/address/{address}")
