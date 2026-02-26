import { useEffect, useState, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useActor } from "../hooks/useActor";
import type { Image } from "../backend";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "webp":
      return "image/webp";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
}

// ────────────────────────────────────────────────────────────
// ViewerPage
// ────────────────────────────────────────────────────────────

export default function ViewerPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const [objectUrls, setObjectUrls] = useState<(string | null)[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loadingBytes, setLoadingBytes] = useState(false);

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getImages();
    },
    enabled: !!actor && !actorFetching,
  });

  // Fetch all image bytes and create object URLs
  useEffect(() => {
    if (!images || images.length === 0) {
      setObjectUrls([]);
      return;
    }

    let cancelled = false;
    const urls: string[] = [];

    async function loadImages() {
      setLoadingBytes(true);
      try {
        const results = await Promise.all(
          images!.map(async (img) => {
            const bytes = await img.blob.getBytes();
            const mime = getMimeType(img.filename);
            const blob = new Blob([bytes], { type: mime });
            return URL.createObjectURL(blob);
          }),
        );
        if (!cancelled) {
          urls.push(...results);
          setObjectUrls(results);
          setCurrentIndex(0);
        }
      } catch (err) {
        console.error("Failed to load image bytes:", err);
        if (!cancelled) setObjectUrls([]);
      } finally {
        if (!cancelled) setLoadingBytes(false);
      }
    }

    loadImages();

    return () => {
      cancelled = true;
      // Revoke any URLs we already created
      for (const u of urls) URL.revokeObjectURL(u);
    };
  }, [images]);

  // Keyboard navigation
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % (objectUrls.length || 1));
  }, [objectUrls.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) =>
      prev === 0 ? (objectUrls.length || 1) - 1 : prev - 1,
    );
  }, [objectUrls.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (objectUrls.length <= 1) return;
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, objectUrls.length]);

  // ── States ──────────────────────────────────────────────

  if (isLoading || actorFetching) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="viewer-empty">
        <p className="viewer-empty__message">No photos yet.</p>
        <Link to="/admin" className="viewer-empty__link">
          Admin →
        </Link>
      </div>
    );
  }

  if (loadingBytes) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  const currentUrl = objectUrls[currentIndex] ?? null;
  const total = objectUrls.length;
  const showNav = total > 1;

  return (
    <div className="viewer-slideshow">
      {/* Full-screen image */}
      {currentUrl && (
        <img
          key={currentUrl}
          src={currentUrl}
          alt={images[currentIndex]?.filename ?? "Photo"}
          className="viewer-slideshow__image"
        />
      )}

      {/* Prev / Next arrows */}
      {showNav && (
        <>
          <button
            type="button"
            onClick={goPrev}
            className="viewer-slideshow__arrow viewer-slideshow__arrow--left"
            aria-label="Previous photo"
          >
            <ChevronLeft size={32} />
          </button>
          <button
            type="button"
            onClick={goNext}
            className="viewer-slideshow__arrow viewer-slideshow__arrow--right"
            aria-label="Next photo"
          >
            <ChevronRight size={32} />
          </button>

          {/* Counter */}
          <div className="viewer-slideshow__counter">
            {currentIndex + 1} / {total}
          </div>
        </>
      )}
    </div>
  );
}
