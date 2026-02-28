# PDF Viewer (Image Gallery)

## Current State
The app is a PDF viewer. The backend stores a single `Pdf` record (blob + filename + uploadedAt). The admin page uploads a single PDF. The viewer displays it via an `<embed>` tag.

## Requested Changes (Diff)

### Add
- Backend: store multiple images (each with blob, filename, uploadedAt)
- Backend: `addImage`, `getImages`, `clearImages`, `removeImage` functions
- Frontend: Admin page accepts multiple image file uploads (JPG, PNG, GIF, WebP)
- Frontend: Viewer page shows a full-screen slideshow with left/right arrow navigation and keyboard support

### Modify
- Backend: Replace single-PDF data model with a list of image records
- Frontend: AdminPage -- change file input to accept images (multiple), update labels and logic
- Frontend: ViewerPage -- replace PDF embed with image slideshow

### Remove
- Backend: `setPdf`, `getPdf`, `clearPdf` functions
- Backend: `Pdf` type
- Frontend: All PDF-specific logic, embed tag, PDF labels

## Implementation Plan
1. Regenerate Motoko backend with image list storage (addImage, getImages, clearImages, removeImage)
2. Update frontend AdminPage: accept multiple images, upload each one, show count of uploaded images
3. Update frontend ViewerPage: fetch image list, show full-screen slideshow with prev/next navigation and keyboard arrows
