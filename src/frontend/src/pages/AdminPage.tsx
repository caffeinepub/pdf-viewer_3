import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileText, ImageIcon, Loader2, Trash2, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import { useActor } from "../hooks/useActor";

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin123";

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface QueuedFile {
  id: string;
  file: File;
  progress: number; // 0–100
  done: boolean;
}

// ─────────────────────────────────────────────────────────────
// Password Gate
// ─────────────────────────────────────────────────────────────

interface PasswordGateProps {
  onSuccess: () => void;
}

function PasswordGate({ onSuccess }: PasswordGateProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="admin-gate">
      <div className="admin-gate__card">
        <div className="admin-gate__logo">
          Gallery<span className="admin-gate__logo-dot">.</span>
        </div>

        <form onSubmit={handleSubmit} className="admin-gate__form">
          <div className="admin-gate__field">
            <label htmlFor="admin-password" className="admin-gate__label">
              Admin Password
            </label>
            <input
              id="admin-password"
              type="password"
              className={`admin-gate__input${error ? " admin-gate__input--error" : ""}`}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Enter password"
              autoComplete="current-password"
            />
            {error && (
              <p className="admin-gate__error">
                Incorrect password. Try again.
              </p>
            )}
          </div>
          <button type="submit" className="admin-gate__submit">
            Enter
          </button>
        </form>

        <p className="admin-gate__hint">admin panel · image gallery</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// PDF Upload Section
// ─────────────────────────────────────────────────────────────

interface PdfSectionProps {
  actor: ReturnType<typeof useActor>["actor"];
}

function PdfSection({ actor }: PdfSectionProps) {
  const queryClient = useQueryClient();
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const { data: currentPdf, isLoading: isPdfLoading } = useQuery<
    import("../backend").ExternalBlob | null
  >({
    queryKey: ["pdf"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPdf();
    },
    enabled: !!actor,
  });

  const hasPdf = currentPdf != null;

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPdfFile(file);
      setPdfProgress(0);
    }
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handlePdfUpload = async () => {
    if (!actor || !pdfFile) return;
    setIsPdfUploading(true);
    setPdfProgress(0);
    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct: number) => {
          setPdfProgress(Math.round(pct));
        },
      );
      await actor.setPdf(blob);
      await queryClient.invalidateQueries({ queryKey: ["pdf"] });
      toast.success("PDF uploaded successfully.");
      setPdfFile(null);
      setPdfProgress(0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed: ${msg}`);
    } finally {
      setIsPdfUploading(false);
    }
  };

  const handleClearPdf = async () => {
    if (!actor) return;
    if (!confirm("Remove the uploaded PDF? This cannot be undone.")) return;
    setIsClearing(true);
    try {
      await actor.clearPdf();
      await queryClient.invalidateQueries({ queryKey: ["pdf"] });
      toast.success("PDF removed.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to remove PDF.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="admin-pdf-section">
      <div className="admin-divider" />

      <div>
        <p className="admin-section-label">Upload PDF</p>

        {/* Current PDF status */}
        {isPdfLoading ? (
          <div className="admin-pdf-status admin-pdf-status--loading">
            <Loader2 size={14} className="animate-spin" />
            <span>Checking PDF status…</span>
          </div>
        ) : hasPdf ? (
          <div className="admin-pdf-status admin-pdf-status--exists">
            <div className="admin-pdf-status__info">
              <FileText size={16} className="admin-pdf-status__icon" />
              <span className="admin-pdf-status__text">PDF uploaded</span>
            </div>
            <button
              type="button"
              onClick={handleClearPdf}
              disabled={isClearing}
              className="admin-pdf-clear-btn"
              title="Remove PDF"
            >
              {isClearing ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <X size={12} />
              )}
              Clear PDF
            </button>
          </div>
        ) : (
          <div className="admin-pdf-status admin-pdf-status--empty">
            <FileText size={14} className="admin-pdf-status__icon--dim" />
            <span>No PDF uploaded yet</span>
          </div>
        )}

        {/* File selector */}
        <div className="admin-pdf-picker" style={{ marginTop: "0.875rem" }}>
          <label htmlFor="pdf-upload" className="admin-pdf-label">
            <input
              id="pdf-upload"
              ref={pdfInputRef}
              type="file"
              accept=".pdf"
              onChange={handlePdfFileChange}
              disabled={isPdfUploading}
              style={{ display: "none" }}
            />
            <span className="admin-pdf-label__btn">
              {pdfFile ? "Change PDF" : "Select PDF"}
            </span>
          </label>

          {pdfFile && (
            <span className="admin-pdf-selected-name">{pdfFile.name}</span>
          )}
        </div>

        {/* Progress bar while uploading */}
        {isPdfUploading && (
          <div
            className="admin-file-item__progress-row"
            style={{ marginTop: "0.5rem" }}
          >
            <div className="admin-file-item__bar-track">
              <div
                className="admin-file-item__bar-fill"
                style={{ width: `${pdfProgress}%` }}
              />
            </div>
            <span className="admin-file-item__pct">{pdfProgress}%</span>
          </div>
        )}
      </div>

      {/* Upload button */}
      <button
        type="button"
        className="admin-upload-btn"
        onClick={handlePdfUpload}
        disabled={!pdfFile || isPdfUploading}
      >
        {isPdfUploading ? (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <Loader2 size={14} className="animate-spin" />
            Uploading PDF…
          </span>
        ) : (
          "Upload PDF"
        )}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Admin Panel
// ─────────────────────────────────────────────────────────────

interface AdminPanelProps {
  onLogout: () => void;
}

function AdminPanel({ onLogout }: AdminPanelProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images = [], isLoading } = useQuery<
    Array<{ filename: string; uploadedAt: bigint }>
  >({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllImages();
    },
    enabled: !!actor && !actorFetching,
  });

  const addFilesToQueue = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!arr.length) return;
    setQueue((prev) => [
      ...prev,
      ...arr.map((file) => ({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        progress: 0,
        done: false,
      })),
    ]);
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFilesToQueue(e.target.files);
      // Reset so same files can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [addFilesToQueue],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!actor || queue.length === 0) return;

    setIsUploading(true);

    let allOk = true;
    const pendingItems = queue.filter((q) => !q.done);

    for (const item of pendingItems) {
      const itemId = item.id;
      try {
        const arrayBuffer = await item.file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
          (pct: number) => {
            setQueue((prev) =>
              prev.map((q) =>
                q.id === itemId ? { ...q, progress: Math.round(pct) } : q,
              ),
            );
          },
        );

        await actor.addImage(blob, item.file.name);

        setQueue((prev) =>
          prev.map((q) =>
            q.id === itemId ? { ...q, progress: 100, done: true } : q,
          ),
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Failed to upload "${item.file.name}": ${msg}`);
        allOk = false;
      }
    }

    await queryClient.invalidateQueries({ queryKey: ["images"] });

    if (allOk) {
      toast.success(
        pendingItems.length === 1
          ? "Image uploaded successfully."
          : `${pendingItems.length} images uploaded.`,
      );
    }

    // Clear done items after a brief moment
    setTimeout(() => {
      setQueue((prev) => prev.filter((q) => !q.done));
    }, 1200);

    setIsUploading(false);
  };

  const handleClearAll = async () => {
    if (!actor) return;
    if (!confirm("Remove all uploaded images? This cannot be undone.")) return;
    setIsClearing(true);
    try {
      await actor.clearAllImages();
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("All images cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear images.");
    } finally {
      setIsClearing(false);
    }
  };

  const imageCount = isLoading || actorFetching ? null : images.length;
  const pendingCount = queue.filter((q) => !q.done).length;

  return (
    <div className="admin-page">
      <div className="admin-card">
        {/* Header */}
        <div className="admin-card__header">
          <div>
            <h1 className="admin-card__title">Gallery Admin</h1>
            <p className="admin-card__subtitle">Upload and manage content</p>
          </div>
          <button
            type="button"
            className="admin-card__logout-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        </div>

        <div className="admin-card__body">
          {/* Stats */}
          <div className="admin-stats">
            <div>
              <div className="admin-stats__count">
                {imageCount === null ? "—" : imageCount}
              </div>
              <div className="admin-stats__label">
                {imageCount === 1 ? "Image" : "Images"}
              </div>
            </div>

            <div className="admin-stats__actions">
              {imageCount !== null && imageCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  disabled={isClearing}
                  title="Clear all images"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    background: "oklch(0.62 0.22 25 / 0.12)",
                    border: "1px solid oklch(0.62 0.22 25 / 0.3)",
                    borderRadius: "0.375rem",
                    padding: "0.375rem 0.75rem",
                    fontSize: "0.75rem",
                    fontFamily: "Sora, sans-serif",
                    fontWeight: 500,
                    color: "oklch(0.7 0.18 25)",
                    cursor: isClearing ? "not-allowed" : "pointer",
                    opacity: isClearing ? 0.5 : 1,
                    transition: "background 0.2s ease",
                  }}
                >
                  {isClearing ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Trash2 size={12} />
                  )}
                  Clear all
                </button>
              )}

              {imageCount !== null && imageCount > 0 && (
                <Link
                  to="/"
                  className="admin-gallery-link"
                  style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
                >
                  View →
                </Link>
              )}
            </div>
          </div>

          <div className="admin-divider" />

          {/* Images Upload Section */}
          <div>
            <p className="admin-section-label">Upload Images</p>

            {/* Drop zone — label wraps hidden file input for accessibility */}
            <label
              htmlFor="image-upload"
              className={`admin-dropzone${isDragOver ? " admin-dropzone--active" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                id="image-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
                style={{ display: "none" }}
              />
              <ImageIcon size={24} className="admin-dropzone__icon" />
              <p className="admin-dropzone__label">
                Drop images here or click to browse
              </p>
              <p className="admin-dropzone__sub">
                JPG, PNG, WebP, GIF · multiple allowed
              </p>
            </label>

            {/* File queue */}
            {queue.length > 0 && (
              <ul className="admin-file-queue" style={{ marginTop: "0.75rem" }}>
                {queue.map((item) => (
                  <li key={item.id} className="admin-file-item">
                    <span className="admin-file-item__name">
                      {item.file.name}
                    </span>
                    {item.done ? (
                      <span className="admin-file-item__done">✓ Uploaded</span>
                    ) : isUploading ? (
                      <div className="admin-file-item__progress-row">
                        <div className="admin-file-item__bar-track">
                          <div
                            className="admin-file-item__bar-fill"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                        <span className="admin-file-item__pct">
                          {item.progress}%
                        </span>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upload button */}
          <button
            type="button"
            className="admin-upload-btn"
            onClick={handleUpload}
            disabled={pendingCount === 0 || isUploading}
          >
            {isUploading ? (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                }}
              >
                <Loader2 size={14} className="animate-spin" />
                Uploading…
              </span>
            ) : pendingCount > 0 ? (
              `Upload ${pendingCount} Image${pendingCount !== 1 ? "s" : ""}`
            ) : (
              "Upload Images"
            )}
          </button>

          {/* Gallery link */}
          {(imageCount ?? 0) > 0 && (
            <Link to="/" className="admin-gallery-link">
              View Gallery →
            </Link>
          )}

          {/* PDF Section */}
          {!!actor && <PdfSection actor={actor} />}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// AdminPage root
// ─────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <AdminPanel onLogout={() => setAuthenticated(false)} />;
}
