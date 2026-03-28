# Quick Kart — Flash Deals Notify Me & Admin Notify

## Current State
- Flash deals section on HomeTab is conditionally rendered with `{flashEnabled && (...)}` — hidden when disabled, nothing shown
- Admin panel has flash deals toggle, title, timer, max products settings saved to localStorage
- No "coming soon" state, no Notify Me feature, no subscriber storage

## Requested Changes (Diff)

### Add
- Backend: `FlashNotifySubscriber` type `{ name: Text; phone: Text; principal: Principal }`
- Backend: `subscribeFlashNotify(name, phone)` — saves caller to notify list (deduplicates by principal)
- Backend: `getFlashNotifySubscribers()` — returns all subscribers (admin only)
- Backend: `clearFlashNotifySubscribers()` — clears all subscribers after admin notifies
- HomeTab: When `flashEnabled = false`, show "Flash Deals Coming Soon" card with countdown message and a "Notify Me" button
- "Notify Me" button: visible only for logged-in users; calls backend to subscribe; shows confirmation toast; disabled after subscription (persist via localStorage flag)
- Non-logged-in users see "Login to get notified" prompt instead
- AdminTab: In Flash Deals settings, show subscriber count badge
- AdminTab: "Notify Users" button — opens a dialog listing all subscribers (name + phone) so admin can contact them, then clears the list after confirming

### Modify
- HomeTab flash section: instead of completely hiding when disabled, show "coming soon" card
- AdminTab flash settings: add subscriber info + notify button below Save button

### Remove
- Nothing removed

## Implementation Plan
1. Update backend main.mo: add subscriber type + 3 new functions
2. Update backend.did.d.ts: add new types + methods
3. Update HomeTab: add coming-soon section with Notify Me button
4. Update AdminTab: add subscriber count + Notify Users button with dialog
