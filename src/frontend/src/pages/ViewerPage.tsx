import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, FileText, Images } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Image } from "../backend";
import { useActor } from "../hooks/useActor";

// ─────────────────────────────────────────────────────────────
// Tab type
// ─────────────────────────────────────────────────────────────

type ActiveTab = "photos" | "pdf";

// ─────────────────────────────────────────────────────────────
// Photos Viewer
// ─────────────────────────────────────────────────────────────

interface PhotosViewerProps {
  images: Image[];
}

function PhotosViewer({ images }: PhotosViewerProps) {
  const total = images.length;
  const [currentIndex, setCurrentIndex] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on total change
  useEffect(() => {
    setCurrentIndex(0);
  }, [total]);

  const prev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (total === 0) return;
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prev, next, total]);

  if (total === 0) {
    return (
      <div className="viewer-tab-empty">
        <h2 className="viewer-empty__title">No images yet</h2>
        <p className="viewer-empty__sub">
          Upload images from the admin panel to get started.
        </p>
        <Link to="/admin" className="viewer-empty__link">
          Go to Admin
        </Link>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const src = currentImage.blob.getDirectURL();

  return (
    <>
      {/* Gradient overlays */}
      <div className="viewer-overlay-top" />
      <div className="viewer-overlay-bottom" />

      {/* Counter */}
      <div className="viewer-counter">
        {currentIndex + 1} / {total}
      </div>

      {/* Image */}
      <img
        key={src}
        src={src}
        alt={currentImage.filename}
        className="viewer-image"
        draggable={false}
      />

      {/* Navigation (only show if more than 1 image) */}
      {total > 1 && (
        <>
          <button
            type="button"
            className="viewer-nav-btn viewer-nav-btn--prev"
            onClick={prev}
            aria-label="Previous image"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            className="viewer-nav-btn viewer-nav-btn--next"
            onClick={next}
            aria-label="Next image"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Filename */}
      <div className="viewer-filename">{currentImage.filename}</div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// PDF Viewer
// ─────────────────────────────────────────────────────────────

function PdfViewer() {
  const { actor, isFetching: actorFetching } = useActor();

  const { data: blobUrl, isLoading } = useQuery<string | null>({
    queryKey: ["pdf-blob-url"],
    queryFn: async () => {
      if (!actor) return null;
      const pdf = await actor.getPdf();
      if (!pdf) return null;
      // Fetch bytes and create a proper blob URL so Chrome renders inline
      const directUrl = pdf.getDirectURL();
      const response = await fetch(directUrl);
      if (!response.ok) throw new Error("Failed to fetch PDF");
      const arrayBuffer = await response.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "application/pdf" });
      return URL.createObjectURL(blob);
    },
    enabled: !!actor && !actorFetching,
  });

  if (isLoading || actorFetching) {
    return (
      <div className="viewer-tab-empty">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  if (!blobUrl) {
    return (
      <div className="viewer-tab-empty">
        <FileText size={40} className="viewer-tab-empty__icon" />
        <h2 className="viewer-empty__title">No PDF uploaded yet</h2>
        <p className="viewer-empty__sub">
          Upload a PDF from the admin panel to display it here.
        </p>
        <Link to="/admin" className="viewer-empty__link">
          Go to Admin
        </Link>
      </div>
    );
  }

  return (
    <iframe
      src={blobUrl}
      className="viewer-pdf-embed"
      title="PDF Viewer"
      style={{ border: "none" }}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// ViewerPage
// ─────────────────────────────────────────────────────────────

export default function ViewerPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const [activeTab, setActiveTab] = useState<ActiveTab>("photos");

  const { data: images = [], isLoading } = useQuery<Image[]>({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !actorFetching,
  });

  // ── Loading ─────────────────────────────────────────────
  if (isLoading || actorFetching) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  // ── Viewer with tabs ──────────────────────────────────────
  return (
    <div className="viewer-root">
      {/* Tab bar */}
      <div className="viewer-tabs">
        <button
          type="button"
          className={`viewer-tab-btn${activeTab === "photos" ? " viewer-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("photos")}
        >
          <Images size={14} />
          Photos
        </button>
        <button
          type="button"
          className={`viewer-tab-btn${activeTab === "pdf" ? " viewer-tab-btn--active" : ""}`}
          onClick={() => setActiveTab("pdf")}
        >
          <FileText size={14} />
          PDF
        </button>
      </div>

      {/* Admin link */}
      <Link to="/admin" className="viewer-admin-link">
        Admin
      </Link>

      {/* Tab content */}
      {activeTab === "photos" ? (
        <PhotosViewer images={images} />
      ) : (
        <PdfViewer />
      )}
    </div>
  );
}
