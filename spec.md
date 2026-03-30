# Quick Kart

## Current State
The app uses a radius-based delivery fee system (baseCharge + distance × chargePerKm) stored in `radiusDeliveryConfig`. Distance is estimated from pincode using a rough lookup table. The admin can set a radius, base charge, and per-km rate.

## Requested Changes (Diff)

### Add
- New `DeliveryTiers` type in backend with 4 exact fee tiers, 3 admin-configurable distance boundaries (km), and a defaultFee for fallback
- `getDeliveryTiers()` and `updateDeliveryTiers(...)` backend functions
- Nominatim (OpenStreetMap) geocoding in the frontend to convert customer address → lat/lng
- Haversine distance calculation between Bhavnathpur Market (store) and customer address
- Delivery fee saved in order address JSON metadata

### Modify
- CartTab: replace radius-based logic with tier-based logic; show "Delivery Fee: ₹XX" in cart summary; geocode address and calculate real distance; fall back to defaultFee (₹40) when geocoding fails
- AdminTab: replace radius UI with 4-tier fee + 3 distance boundary inputs, connected to new `updateDeliveryTiers` function
- backend.d.ts: add DeliveryTiers interface and functions

### Remove
- Radius-based delivery fee UI in AdminTab (replaced by tiered UI)
- Pincode-based distance estimate in CartTab (replaced by geocoding + Haversine)

## Implementation Plan
1. Add `DeliveryTiers` type and functions to main.mo
2. Update backend.d.ts with new type and function signatures
3. Update CartTab.tsx: geocode address via Nominatim, calculate Haversine distance from store, apply tier fee, show clearly in cart
4. Update AdminTab.tsx: new delivery settings UI for 4 tiers with fee and boundary inputs
