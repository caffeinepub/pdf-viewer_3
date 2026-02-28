# PDF Viewer

## Current State

The app has:
- A backend with `addImage`, `getAllImages`, `removeImage`, `clearAllImages` for storing images as `ExternalBlob`
- An admin page (`/admin`) with password gate (`admin123`), drag-and-drop image upload, queue progress, and clear-all
- A viewer page (`/`) showing a full-screen slideshow of images with keyboard and arrow navigation
- blob-storage component integrated

## Requested Changes (Diff)

### Add
- Backend: `setPDF(blob, filename)`, `getPDF()`, `clearPDF()` methods to store a single PDF separately from images
- Admin page: Second upload section for a single PDF (below images section), with upload, status display, and clear button
- Viewer page: Two-tab interface -- "Photos" tab (existing slideshow) and "PDF" tab (inline PDF viewer using embed/iframe)

### Modify
- Admin page: Add PDF upload section with its own file input (accepts `.pdf` only), upload button, and current PDF status
- Viewer page: Add tab switcher at the top; Photos tab shows existing slideshow; PDF tab shows the PDF inline

### Remove
- Nothing removed

## Implementation Plan

1. **Backend**: Add `setPDF`, `getPDF`, `clearPDF` to `main.mo`. Store PDF as `?{ blob: ExternalBlob; filename: Text; uploadedAt: Time }` (optional, single record)
2. **Frontend - AdminPage**: Add PDF section below images section with:
   - File input accepting `.pdf` only
   - Current PDF status (filename + date if uploaded, or "No PDF uploaded")
   - Upload button
   - Clear PDF button (if PDF exists)
3. **Frontend - ViewerPage**: Add tab bar with "Photos" and "PDF" tabs:
   - Photos tab: existing slideshow behavior unchanged
   - PDF tab: fetch PDF from backend, render inline using `<embed>` with `application/pdf` type
   - If no PDF uploaded, show empty state with link to admin
