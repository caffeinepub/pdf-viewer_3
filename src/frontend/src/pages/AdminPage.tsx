import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import type { Pdf } from "../backend";
import { useActor } from "../hooks/useActor";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin123";

function formatDate(time: bigint): string {
  // ICP Time is nanoseconds since Unix epoch
  const ms = Number(time / 1_000_000n);
  return new Date(ms).toLocaleString();
}

// ────────────────────────────────────────────────────────────
// Password Gate
// ────────────────────────────────────────────────────────────

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
      <Card className="admin-gate__card">
        <CardHeader>
          <CardTitle>Admin Access</CardTitle>
          <CardDescription>
            Enter the admin password to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="admin-gate__form">
            <div className="admin-gate__field">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                placeholder="Enter password"
                autoFocus
              />
              {error && (
                <p className="admin-gate__error">
                  Incorrect password. Try again.
                </p>
              )}
            </div>
            <Button type="submit" className="admin-gate__submit">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Admin Panel
// ────────────────────────────────────────────────────────────

interface AdminPanelProps {
  onLogout: () => void;
}

function AdminPanel({ onLogout }: AdminPanelProps) {
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: pdf, isLoading } = useQuery<Pdf | null>({
    queryKey: ["pdf"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getPdf();
    },
    enabled: !!actor && !actorFetching,
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      setSelectedFile(file);
      setUploadSuccess(false);
      setUploadProgress(0);
    },
    [],
  );

  const handleUpload = async () => {
    if (!actor || !selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
        (pct: number) => {
          setUploadProgress(Math.round(pct));
        },
      );

      await actor.setPdf(blob, selectedFile.name);
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["pdf"] });
      toast.success("PDF uploaded successfully.");
    } catch (err) {
      console.error("Upload error:", err);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Upload failed: ${message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = async () => {
    if (!actor) return;
    setIsClearing(true);
    try {
      await actor.clearPdf();
      await queryClient.invalidateQueries({ queryKey: ["pdf"] });
      toast.success("PDF cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear PDF.");
    } finally {
      setIsClearing(false);
    }
  };

  const hasPdf = !!pdf;

  return (
    <div className="admin-panel">
      <Card className="admin-panel__card">
        <CardHeader className="admin-panel__header">
          <CardTitle>PDF Admin</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="admin-panel__logout"
          >
            Logout
          </Button>
        </CardHeader>

        <CardContent className="admin-panel__content">
          {/* Current PDF info */}
          {isLoading || actorFetching ? (
            <div className="admin-panel__current">
              <p className="admin-panel__loading-text">Loading PDF info…</p>
            </div>
          ) : hasPdf ? (
            <div className="admin-panel__current">
              <p className="admin-panel__label">Current PDF</p>
              <p className="admin-panel__filename">{pdf.filename}</p>
              <p className="admin-panel__date">{formatDate(pdf.uploadedAt)}</p>
              <div className="admin-panel__actions-row">
                <Link to="/" className="admin-panel__view-link">
                  View PDF →
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isClearing}
                  className="admin-panel__clear-btn"
                >
                  {isClearing ? "Clearing…" : "Clear PDF"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-panel__current">
              <p className="admin-panel__no-pdf">No PDF uploaded yet.</p>
            </div>
          )}

          {/* Divider */}
          <div className="admin-panel__divider" />

          {/* Upload section */}
          <div className="admin-panel__upload">
            <p className="admin-panel__label">
              {hasPdf ? "Replace PDF" : "Upload PDF"}
            </p>

            <div className="admin-panel__field">
              <Label htmlFor="pdf-file">Choose a PDF file</Label>
              <Input
                id="pdf-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {selectedFile && (
                <p className="admin-panel__progress-text">
                  {selectedFile.name}
                </p>
              )}
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="admin-panel__progress">
                <Progress
                  value={uploadProgress}
                  className="admin-panel__progress-bar"
                />
                <p className="admin-panel__progress-text">
                  Uploading… {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            {/* Success message */}
            {uploadSuccess && (
              <div className="admin-panel__success">
                <p className="admin-panel__success-text">
                  PDF uploaded successfully.{" "}
                  <Link to="/" className="admin-panel__view-link">
                    View PDF →
                  </Link>
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="admin-panel__upload-btn"
            >
              {isUploading ? "Uploading…" : "Upload PDF"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Admin Page (root)
// ────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  if (!authenticated) {
    return <PasswordGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <AdminPanel onLogout={() => setAuthenticated(false)} />;
}
