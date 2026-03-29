# Quick Kart

## Current State
The backend has `updateDistanceDeliverySettings(baseDeliveryFee, range1Extra, range2Extra, range3Extra, range4Extra)` with 4 range-based distance tiers. AdminTab uses this to manage delivery fees. CartTab uses `estimateDistanceRange(pincode)` to pick a range and compute fee.

## Requested Changes (Diff)

### Add
- New backend type `RadiusDeliveryConfig` with fields: `radiusKm`, `baseCharge`, `chargePerKm`, `lastUpdated`
- New backend function `updateDistanceDeliverySettings(radiusKm, baseCharge, chargePerKm)` — replaces old signature
- New backend query `getRadiusDeliveryConfig()` returning `RadiusDeliveryConfig`
- Admin Settings section: inputs for Delivery Radius (KM), Base Delivery Charge, Charge per KM + "Update Delivery Settings" button
- In CartTab: calculate estimated distance from pincode, show delivery distance + charge, block order if distance > radiusKm with "Delivery not available" message
- deliveryCharge = baseCharge + (distance * chargePerKm)

### Modify
- `updateDistanceDeliverySettings` in Motoko: new signature `(radiusKm: Float, baseCharge: Float, chargePerKm: Float)`
- `backend.d.ts`: update `updateDistanceDeliverySettings` signature + add `RadiusDeliveryConfig` type + `getRadiusDeliveryConfig`
- `AdminTab.tsx`: replace old distance delivery UI with 3 new fields
- `CartTab.tsx`: replace pincode-range logic with radius-based logic using `getRadiusDeliveryConfig`

### Remove
- Old range-based distance fee logic (range1Extra, range2Extra, range3Extra, range4Extra) from admin UI
- `estimateDistanceRange` function (replaced by direct distance estimation)

## Implementation Plan
1. Update Motoko backend: add RadiusDeliveryConfig type, state variable, getter, and replace updateDistanceDeliverySettings with new 3-param signature
2. Update backend.d.ts with new types and function signatures
3. Update AdminTab.tsx: replace old 4-range UI with radiusKm, baseCharge, chargePerKm inputs
4. Update CartTab.tsx: fetch radius config, compute estimated distance from pincode, apply formula, show distance + charge, block if out of range
