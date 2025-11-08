"""
Deploy smart contract to Algorand TestNet
"""
import os
import json
from pathlib import Path
from dotenv import load_dotenv, set_key
from algosdk import account, mnemonic
from algosdk.v2client import algod
from beaker import client as beaker_client
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Load environment
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

def get_algod_client():
    """Get Algod client"""
    algod_address = os.environ.get('ALGOD_ADDRESS', 'https://testnet-api.algonode.cloud')
    algod_token = os.environ.get('ALGOD_TOKEN', '')
    return algod.AlgodClient(algod_token, algod_address)

def get_deployer_account():
    """Get deployer account from mnemonic"""
    phrase = os.environ.get('DEPLOYER_MNEMONIC')
    if not phrase:
        raise Exception("DEPLOYER_MNEMONIC not found in .env")
    
    private_key = mnemonic.to_private_key(phrase)
    address = account.address_from_private_key(private_key)
    return private_key, address

def check_balance(client, address):
    """Check account balance"""
    try:
        account_info = client.account_info(address)
        balance = account_info['amount'] / 1_000_000
        return balance
    except Exception as e:
        print(f"⚠️  Error checking balance: {e}")
        return 0

def deploy_contract():
    """Deploy smart contract to Algorand"""
    print("🚀 Deploying AKTA MMI Smart Contract to Algorand TestNet")
    print("="*60)
    
    # Get clients and accounts
    client = get_algod_client()
    private_key, deployer_address = get_deployer_account()
    
    print(f"📍 Deployer Address: {deployer_address}")
    
    # Check balance
    balance = check_balance(client, deployer_address)
    print(f"💰 Balance: {balance} ALGO")
    
    if balance < 0.1:
        print("\n❌ Insufficient balance for deployment!")
        print("   Minimum required: 0.1 ALGO")
        print(f"\n💡 Fund your wallet at: https://bank.testnet.algorand.network/")
        print(f"   Address: {deployer_address}")
        return None
    
    # Load contract
    print("\n📝 Loading smart contract...")
    from contract import app
    
    # Create application client
    app_client = beaker_client.ApplicationClient(
        client=client,
        app=app,
        signer=private_key
    )
    
    print("🔨 Deploying contract...")
    try:
        # Deploy application
        app_id, app_addr, txid = app_client.create()
        
        print("\n✅ Contract deployed successfully!")
        print(f"📱 App ID: {app_id}")
        print(f"📍 App Address: {app_addr}")
        print(f"🔗 Transaction ID: {txid}")
        print(f"\n🔍 View on AlgoExplorer:")
        print(f"   https://testnet.algoexplorer.io/application/{app_id}")
        
        # Update .env with APP_ID
        env_file = ROOT_DIR / '.env'
        set_key(env_file, "APP_ID", str(app_id))
        print(f"\n✅ Updated .env with APP_ID={app_id}")
        
        # Update admin wallet in database
        print("\n💡 Next steps:")
        print("   1. Update admin record in database with deployer address")
        print(f"      Admin wallet: {deployer_address}")
        print("   2. Test the contract with a redistribution")
        
        return app_id
    
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        return None

if __name__ == '__main__':
    deploy_contract()
