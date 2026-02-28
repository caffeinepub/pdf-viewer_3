import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
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

  const pdfUrl = pdf.blob.getDirectURL();

  return (
    <div className="viewer-pdf">
      <embed
        src={pdfUrl}
        type="application/pdf"
        width="100%"
        height="100%"
        title={pdf.filename}
      />
    </div>
  );
}
