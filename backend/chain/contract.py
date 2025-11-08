"""
AKTA MMI - Algorand Smart Contract
Simple attestation contract for redistribution approvals

This contract stores attestation hashes of redistribution approvals
on the Algorand blockchain for immutability and auditability.
"""
from beaker import *
from pyteal import *

class RedistributionState:
    """Global state for the contract"""
    # Admin address authorized to approve redistributions
    admin_address = GlobalStateValue(
        stack_type=TealType.bytes,
        descr="Admin Algorand address"
    )
    
    # Total count of redistributions attested
    total_redistributions = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(0),
        descr="Total redistributions attested"
    )
    
    # Contract version
    version = GlobalStateValue(
        stack_type=TealType.uint64,
        default=Int(1),
        descr="Contract version"
    )

# Create Beaker application
app = Application("AKTARedistribution", state=RedistributionState())

@app.create
def create() -> Expr:
    """
    Initialize contract on creation
    Set admin to creator address
    """
    return Seq([
        app.state.admin_address.set(Txn.sender()),
        app.state.total_redistributions.set(Int(0)),
        app.state.version.set(Int(1)),
        Approve()
    ])

@app.external
def attest_redistribution(
    redistribution_id: abi.String,
    payload_hash: abi.DynamicBytes,
    from_kiosk: abi.String,
    to_kiosk: abi.String
) -> Expr:
    """
    Attest a redistribution approval on-chain
    
    Args:
        redistribution_id: UUID of the redistribution
        payload_hash: SHA-256 hash of redistribution payload
        from_kiosk: Source kiosk ID
        to_kiosk: Destination kiosk ID
    
    Returns:
        Success if attestation recorded
    
    Authorization: Only admin can call
    """
    return Seq([
        # Verify caller is admin
        Assert(
            Txn.sender() == app.state.admin_address,
            comment="Only admin can attest"
        ),
        
        # Verify payload hash length (should be 32 bytes for SHA-256)
        Assert(
            Len(payload_hash.get()) == Int(32),
            comment="Invalid hash length"
        ),
        
        # Increment counter
        app.state.total_redistributions.set(
            app.state.total_redistributions + Int(1)
        ),
        
        # Log event for indexer
        Log(Concat(
            Bytes("REDISTRIBUTION:"),
            redistribution_id.get(),
            Bytes(":"),
            from_kiosk.get(),
            Bytes("->"),
            to_kiosk.get()
        )),
        
        Approve()
    ])

@app.external(read_only=True)
def get_stats(*, output: abi.Uint64) -> Expr:
    """
    Get contract statistics
    
    Returns:
        Total redistributions count
    """
    return output.set(app.state.total_redistributions)

@app.external
def update_admin(new_admin: abi.Address) -> Expr:
    """
    Update admin address (admin only)
    
    Args:
        new_admin: New admin address
    
    Authorization: Only current admin
    """
    return Seq([
        Assert(
            Txn.sender() == app.state.admin_address,
            comment="Only admin can update admin"
        ),
        app.state.admin_address.set(new_admin.get()),
        Approve()
    ])

@app.delete(authorize=Authorize.only(Global.creator_address()))
def delete() -> Expr:
    """
    Delete contract (creator only)
    Only for emergency or upgrade scenarios
    """
    return Approve()

# Build application spec
if __name__ == "__main__":
    import json
    from pathlib import Path
    
    # Build the application
    app_spec = app.build()
    
    # Save contract artifacts
    output_dir = Path(__file__).parent / "artifacts"
    output_dir.mkdir(exist_ok=True)
    
    # Save application spec
    with open(output_dir / "application.json", "w") as f:
        json.dump(app_spec.to_json(), f, indent=2)
    
    # Save approval program
    with open(output_dir / "approval.teal", "w") as f:
        f.write(app_spec.approval_program)
    
    # Save clear program
    with open(output_dir / "clear.teal", "w") as f:
        f.write(app_spec.clear_program)
    
    print("✅ Smart contract compiled successfully!")
    print(f"📁 Artifacts saved to: {output_dir}")
    print("\nFiles generated:")
    print("  - application.json (Application spec)")
    print("  - approval.teal (Approval program)")
    print("  - clear.teal (Clear state program)")
