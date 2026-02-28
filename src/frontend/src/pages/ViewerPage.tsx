import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { Image } from "../backend";
import { useActor } from "../hooks/useActor";

// ─────────────────────────────────────────────────────────────
// ViewerPage
// ─────────────────────────────────────────────────────────────

export default function ViewerPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: images = [], isLoading } = useQuery<Image[]>({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !actorFetching,
  });

  const total = images.length;

  // Reset index when image list length changes
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

  // ── Loading ─────────────────────────────────────────────
  if (isLoading || actorFetching) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  // ── Empty ───────────────────────────────────────────────
  if (total === 0) {
    return (
      <div className="viewer-empty">
        <h1 className="viewer-empty__title">No images yet</h1>
        <p className="viewer-empty__sub">
          Upload images from the admin panel to get started.
        </p>
        <Link to="/admin" className="viewer-empty__link">
          Go to Admin
        </Link>
      </div>
    );
  }

  // ── Viewer ──────────────────────────────────────────────
  const currentImage = images[currentIndex];
  const src = currentImage.blob.getDirectURL();

  return (
    <div className="viewer-root">
      {/* Gradient overlays */}
      <div className="viewer-overlay-top" />
      <div className="viewer-overlay-bottom" />

      {/* Counter */}
      <div className="viewer-counter">
        {currentIndex + 1} / {total}
      </div>

      {/* Admin link */}
      <Link to="/admin" className="viewer-admin-link">
        Admin
      </Link>

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
    </div>
  );
}
