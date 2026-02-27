import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Pdf } from "../backend";
import { useActor } from "../hooks/useActor";

// ────────────────────────────────────────────────────────────
// ViewerPage
// ────────────────────────────────────────────────────────────

export default function ViewerPage() {
  const { actor, isFetching: actorFetching } = useActor();
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [loadingBytes, setLoadingBytes] = useState(false);

  const { data: pdf, isLoading } = useQuery<Pdf | null>({
    queryKey: ["pdf"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPdf();
    },
    enabled: !!actor && !actorFetching,
  });

  // Fetch PDF bytes and create object URL
  useEffect(() => {
    if (!pdf) {
      setObjectUrl(null);
      return;
    }

    let cancelled = false;
    let createdUrl: string | null = null;

    async function loadPdf() {
      setLoadingBytes(true);
      try {
        const bytes = await pdf!.blob.getBytes();
        const blob = new Blob([bytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        if (!cancelled) {
          createdUrl = url;
          setObjectUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error("Failed to load PDF bytes:", err);
        if (!cancelled) setObjectUrl(null);
      } finally {
        if (!cancelled) setLoadingBytes(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [pdf]);

  // ── States ──────────────────────────────────────────────

  if (isLoading || actorFetching) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  if (!pdf) {
    return (
      <div className="viewer-empty">
        <p className="viewer-empty__message">No PDF uploaded yet.</p>
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

  return (
    <div className="viewer-pdf">
      {objectUrl && (
        <embed
          src={objectUrl}
          type="application/pdf"
          width="100%"
          height="100%"
          title={pdf.filename}
        />
      )}
    </div>
  );
}
