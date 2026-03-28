# Quick Kart

## Current State
App has an Admin Panel (PIN: 2477) with product management, order management, and settings. Orders include customerName, address (JSON with flat/building/landmark/area/phone), itemsJson, totalAmount, paymentMethod, status.

## Requested Changes (Diff)

### Add
- DeliveryAgentPanel component: separate screen with PIN login (PIN: 7890)
- Shows orders filtered to `confirmed` + `outForDelivery` statuses (delivery-relevant)
- Each order card shows: customer name, phone (from address JSON), full address, items list, total, order time
- "Mark Delivered" button on outForDelivery orders
- Entry point via Profile tab "Delivery Agent Login" button

### Modify
- App.tsx: add `showDelivery` state, render DeliveryAgentPanel overlay (same pattern as Admin)
- ProfileTab: add a "🛵 Delivery Agent" button to open the panel

### Remove
- Nothing removed

## Implementation Plan
1. Create `src/frontend/src/tabs/DeliveryAgentPanel.tsx` with PIN gate (PIN: 7890), order list filtered to delivery-relevant statuses, full order detail cards
2. Update App.tsx to handle `showDelivery` state and render panel
3. Update ProfileTab to add delivery agent login button
