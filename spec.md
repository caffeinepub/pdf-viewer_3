# PDF Viewer

## Current State
The app currently stores and displays multiple images (photos) via a slideshow. The backend stores `Image` objects with blob, filename, and uploadedAt. The frontend has an AdminPage (password-protected upload) and a ViewerPage (full-screen slideshow with arrows). PDF support was previously attempted but had blank screen and download issues.

## Requested Changes (Diff)

### Add
- PDF upload and display support using `<embed>` tag for reliable inline rendering with clickable links
- A single PDF stored and retrieved from blob-storage

### Modify
- Backend: rename Image type to PDF, store a single PDF blob instead of multiple images; replace `setImages`/`getImages`/`clearImages` with `setPDF`/`getPDF`/`clearPDF`
- AdminPage: accept only `.pdf` files (single file), update labels to reference PDF instead of photos, show current PDF filename and upload date
- ViewerPage: display the PDF using `<embed>` tag with `type="application/pdf"` full-screen; fetch bytes, create a blob URL with correct MIME type `application/pdf`, render in `<embed src=...>`

### Remove
- Multi-image slideshow (arrows, counter, keyboard navigation)
- Image MIME type detection helper

## Implementation Plan
1. Regenerate backend with PDF-focused data model: single PDF stored, with setPDF, getPDF, clearPDF functions
2. Update AdminPage to accept single PDF file, update all labels/text from photos to PDF
3. Update ViewerPage to fetch PDF bytes, create blob URL with `application/pdf` MIME type, and display using `<embed>` tag full-screen
4. Remove slideshow navigation code
