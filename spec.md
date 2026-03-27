# Quick Kart

## Current State
The AdminTab has a product form with an "Image URL" text input. Admins paste external image URLs. ProductCard displays images using `product.image` which maps from `p.imageUrl` in backend. The backend has `MixinStorage` (blob-storage) available. `StorageClient` exists in `src/frontend/src/utils/StorageClient.ts` with `putFile()` and `getDirectURL()` methods. The `loadConfig()` in `config.ts` sets up storage gateway URL, bucket name, project ID, and backend canister ID.

## Requested Changes (Diff)

### Add
- File upload input (device file picker) in the Add/Edit Product form in AdminTab
- Upload progress indicator during file upload
- `createStorageClient()` helper that uses `loadConfig()` to initialize StorageClient
- After upload completes, auto-populate the imageUrl field with the generated storage URL

### Modify
- AdminTab image section: replace single URL-only input with dual option — file picker (primary) + URL input (secondary/fallback)
- When a file is selected, upload it immediately using StorageClient, show progress, then store the resulting URL in `form.imageUrl`
- ProductCard: add `onError` fallback for broken images (show placeholder)

### Remove
- Dependency on external image links as the only option (keep URL as fallback only)

## Implementation Plan
1. In AdminTab, add `imageUploading` and `imageUploadProgress` state
2. Add `handleImageFileChange` async function: reads file, calls `storageClient.putFile()`, calls `storageClient.getDirectURL()`, sets `form.imageUrl`
3. Replace the image URL input section with: file picker button + upload progress + URL input below as fallback
4. Initialize StorageClient inline in the handler using `loadConfig()`
5. In ProductCard, add `onError` to the img tag to show a gray placeholder
