import { useState, useRef, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useActor } from "../hooks/useActor";
import { ExternalBlob } from "../backend";
import type { Image } from "../backend";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

const ADMIN_PASSWORD = "admin123";

function formatDate(time: bigint): string {
  // ICP Time is nanoseconds since Unix epoch
  const ms = Number(time / 1_000_000n);
  return new Date(ms).toLocaleString();
}

function readFileAsBytes(file: File): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      resolve(new Uint8Array(buffer) as Uint8Array<ArrayBuffer>);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
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
          <CardDescription>Enter the admin password to continue.</CardDescription>
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
                <p className="admin-gate__error">Incorrect password. Try again.</p>
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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: images, isLoading } = useQuery<Image[]>({
    queryKey: ["images"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getImages();
    },
    enabled: !!actor && !actorFetching,
  });

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      setSelectedFiles(files);
      setUploadSuccess(false);
      setUploadProgress(0);
    },
    [],
  );

  const handleUpload = async () => {
    if (!actor || selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadSuccess(false);

    try {
      const total = selectedFiles.length;
      const blobs: ExternalBlob[] = [];
      const filenames: string[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const bytes = await readFileAsBytes(file);

        // Track per-file progress scaled across all files
        const fileStartPct = (i / total) * 100;
        const fileEndPct = ((i + 1) / total) * 100;

        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress(
          (pct: number) => {
            const scaled = fileStartPct + (pct / 100) * (fileEndPct - fileStartPct);
            setUploadProgress(Math.round(scaled));
          },
        );

        blobs.push(blob);
        filenames.push(file.name);
      }

      await actor.setImages(blobs, filenames);
      setUploadProgress(100);
      setUploadSuccess(true);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success(
        total === 1
          ? "Photo uploaded successfully."
          : `${total} photos uploaded successfully.`,
      );
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
      await actor.clearImages();
      await queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Photos cleared.");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear photos.");
    } finally {
      setIsClearing(false);
    }
  };

  const photoCount = images?.length ?? 0;

  return (
    <div className="admin-panel">
      <Card className="admin-panel__card">
        <CardHeader className="admin-panel__header">
          <CardTitle>Photo Admin</CardTitle>
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
          {/* Current photos info */}
          {isLoading || actorFetching ? (
            <div className="admin-panel__current">
              <p className="admin-panel__loading-text">Loading photos…</p>
            </div>
          ) : photoCount > 0 ? (
            <div className="admin-panel__current">
              <p className="admin-panel__label">Current Photos</p>
              <p className="admin-panel__filename">
                {photoCount} {photoCount === 1 ? "photo" : "photos"} uploaded
              </p>
              <ul className="admin-panel__filelist">
                {images!.map((img) => (
                  <li key={img.filename + String(img.uploadedAt)} className="admin-panel__fileitem">
                    <span className="admin-panel__fileitem-name">{img.filename}</span>
                    <span className="admin-panel__fileitem-date">
                      {formatDate(img.uploadedAt)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="admin-panel__actions-row">
                <Link to="/" className="admin-panel__view-link">
                  View Photos →
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={isClearing}
                  className="admin-panel__clear-btn"
                >
                  {isClearing ? "Clearing…" : "Clear Photos"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="admin-panel__current">
              <p className="admin-panel__no-pdf">No photos uploaded yet.</p>
            </div>
          )}

          {/* Divider */}
          <div className="admin-panel__divider" />

          {/* Upload section */}
          <div className="admin-panel__upload">
            <p className="admin-panel__label">
              {photoCount > 0 ? "Replace Photos" : "Upload Photos"}
            </p>

            <div className="admin-panel__field">
              <Label htmlFor="image-files">Choose image files</Label>
              <Input
                id="image-files"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {selectedFiles.length > 0 && (
                <p className="admin-panel__progress-text">
                  {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
                </p>
              )}
            </div>

            {/* Progress bar */}
            {isUploading && (
              <div className="admin-panel__progress">
                <Progress value={uploadProgress} className="admin-panel__progress-bar" />
                <p className="admin-panel__progress-text">
                  Uploading… {Math.round(uploadProgress)}%
                </p>
              </div>
            )}

            {/* Success message */}
            {uploadSuccess && (
              <div className="admin-panel__success">
                <p className="admin-panel__success-text">
                  Photos uploaded successfully.{" "}
                  <Link to="/" className="admin-panel__view-link">
                    View Photos →
                  </Link>
                </p>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || isUploading}
              className="admin-panel__upload-btn"
            >
              {isUploading ? "Uploading…" : "Upload Photos"}
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
