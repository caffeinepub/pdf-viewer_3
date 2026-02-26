# Photo Viewer (formerly PDF Viewer)

## Current State

The app has:
- An admin page (`/admin`) with password protection (`admin123`) that allows uploading a single PDF file via blob-storage
- A viewer page (`/`) that fetches the PDF blob, creates an object URL, and renders it in a full-screen iframe
- Backend stores a single `PdfReference` (blob + filename + uploadedAt)

## Requested Changes (Diff)

### Add
- Support for multiple image uploads (admin can select multiple image files at once)
- Backend storage for an ordered list of image references (blob + filename + uploadedAt per image)
- Viewer page: full-screen image slideshow with prev/next navigation arrows and a photo counter (e.g. "2 / 5")
- Keyboard navigation (left/right arrow keys) in the viewer

### Modify
- Admin file input: change `accept` from `.pdf` to `image/*`, allow multiple file selection
- Admin panel labels: "PDF" -> "Photos" throughout the UI
- Admin "current" section: show count of uploaded photos instead of a single filename
- Admin clear action: clears all photos
- Viewer page: replace iframe PDF rendering with a full-screen `<img>` tag cycling through images
- Backend: replace single `PdfReference` with a list of image references

### Remove
- PDF-specific code (iframe rendering, `application/pdf` blob creation)
- Single-file upload logic

## Implementation Plan

1. Generate new Motoko backend with:
   - `ImageReference` type (blob, filename, uploadedAt)
   - `setImages(blobs, filenames)` -- replaces all images at once
   - `getImages()` -- returns array of ImageReference
   - `clearImages()` -- clears all images

2. Update frontend:
   - `AdminPage.tsx`: multi-file input, upload all selected images, show count of current photos, update labels
   - `ViewerPage.tsx`: fetch image list, display full-screen with prev/next navigation, keyboard support
   - Remove old PDF references from both pages

## UX Notes

- Viewer: full-screen black background, images centered and scaled to fit (object-fit: contain)
- Navigation arrows: translucent overlays on left/right edges, large tap targets
- Counter shown at top or bottom center (e.g. "1 / 5")
- If no images uploaded, show a friendly "No photos yet" message with admin link
