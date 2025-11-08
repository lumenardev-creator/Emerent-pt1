"""
Pricing calculation utilities
"""
import os
from typing import Dict, List
from decimal import Decimal

def get_price_ratios() -> tuple[float, float]:
    """
    Get pricing ratios from environment
    
    Returns:
        (oversupply_ratio, undersupply_ratio)
    """
    oversupply = float(os.environ.get('PRICE_RATIO_OVER', '0.85'))
    undersupply = float(os.environ.get('PRICE_RATIO_UNDER', '1.05'))
    return oversupply, undersupply

def calculate_redistribution_pricing(
    items: List[Dict],
    from_kiosk_inventory: Dict,
    to_kiosk_inventory: Dict,
    product_prices: Dict
) -> Dict:
    """
    Calculate pricing for redistribution
    
    Args:
        items: List of {sku, quantity} items
        from_kiosk_inventory: Source kiosk inventory {sku: quantity}
        to_kiosk_inventory: Destination kiosk inventory {sku: quantity}
        product_prices: Product pricing data {sku: {acquired_price, suggested_price}}
    
    Returns:
        Pricing dictionary with breakdown
    """
    oversupply_ratio, undersupply_ratio = get_price_ratios()
    
    total_cost = Decimal('0')
    total_revenue = Decimal('0')
    item_pricing = []
    
    for item in items:
        sku = item['sku']
        quantity = item['quantity']
        
        # Get product pricing
        product_price = product_prices.get(sku, {})
        acquired_price = Decimal(str(product_price.get('acquired_price', 0)))
        suggested_price = Decimal(str(product_price.get('suggested_price', 0)))
        
        # Determine if oversupply or undersupply
        from_qty = from_kiosk_inventory.get(sku, 0)
        to_qty = to_kiosk_inventory.get(sku, 0)
        
        # Oversupply: source has excess
        # Undersupply: destination needs
        
        if from_qty > to_qty * 2:  # Oversupply condition
            unit_price = suggested_price * Decimal(str(oversupply_ratio))
            pricing_type = 'oversupply'
        else:  # Undersupply condition
            unit_price = acquired_price * Decimal(str(undersupply_ratio))
            pricing_type = 'undersupply'
        
        item_total = unit_price * quantity
        
        item_pricing.append({
            'sku': sku,
            'quantity': quantity,
            'unit_price': float(unit_price),
            'total': float(item_total),
            'pricing_type': pricing_type
        })
        
        total_cost += acquired_price * quantity
        total_revenue += item_total
    
    return {
        'items': item_pricing,
        'total_cost': float(total_cost),
        'total_revenue': float(total_revenue),
        'net_value': float(total_revenue - total_cost),
        'oversupply_ratio': oversupply_ratio,
        'undersupply_ratio': undersupply_ratio
    }
