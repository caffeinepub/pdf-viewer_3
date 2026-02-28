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

  const { data: pdf, isLoading } = useQuery<Pdf | null>({
    queryKey: ["pdf"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPdf();
    },
    enabled: !!actor && !actorFetching,
  });

  // ── Blob URL built from raw bytes so Chrome receives the
  //    correct application/pdf content-type and displays inline ──
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [bytesLoading, setBytesLoading] = useState(false);

  useEffect(() => {
    if (!pdf) {
      setBlobUrl(null);
      return;
    }

    let revoked = false;
    let objectUrl: string | null = null;

    setBytesLoading(true);

    pdf.blob
      .getBytes()
      .then((bytes) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(
          new Blob([bytes], { type: "application/pdf" }),
        );
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error("Failed to fetch PDF bytes:", err);
      })
      .finally(() => {
        if (!revoked) setBytesLoading(false);
      });

    return () => {
      revoked = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [pdf]);

  // ── States ──────────────────────────────────────────────

  if (isLoading || actorFetching || bytesLoading) {
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

  if (!blobUrl) {
    return (
      <div className="viewer-loading">
        <div className="viewer-loading__spinner" />
      </div>
    );
  }

  return (
    <div className="viewer-pdf">
      <embed
        src={blobUrl}
        type="application/pdf"
        width="100%"
        height="100%"
        title={pdf.filename}
      />
    </div>
  );
}
