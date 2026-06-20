"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, Loader2, Camera, Crop } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatAPIError } from "@/lib/error-formatter";
import { Button } from "@/components/ui/button";
import { ImageCropper } from "@/components/shared/image-cropper";
import { CameraCapture } from "@/components/shared/camera-capture";
import { useHKActive } from "@/components/shared/hk-decorations";
import { HK_LOADING_MESSAGES } from "@/components/shared/hk-loader";
import { useBatActive } from "@/components/shared/bat-decorations";
import { BAT_LOADING_MESSAGES } from "@/components/shared/bat-loader";

interface FileUploadProps {
  onExtracted: (text: string, fileName: string) => void;
  accept?: string[];
  maxSizeMb?: number;
  className?: string;
}

const DEFAULT_ACCEPT = [".pdf", ".docx", ".txt", ".md"];

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

const IMAGE_EXTS = [".png", ".jpg", ".jpeg", ".webp"];

function isImage(name: string): boolean {
  const lower = name.toLowerCase();
  return IMAGE_EXTS.some((e) => lower.endsWith(e));
}

/** Base name + ".jpg" — the cropper always exports JPEG. */
function jpegName(original: string): string {
  const base = original.replace(/\.[^.]+$/, "") || "image";
  return `${base}.jpg`;
}

export function FileUpload({
  onExtracted,
  accept = DEFAULT_ACCEPT,
  maxSizeMb = 10,
  className,
}: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const bat = useBatActive();
  const [extracted, setExtracted] = useState(false);
  const [isImageSource, setIsImageSource] = useState(false);
  const hk = useHKActive();

  // Cropper / camera flow state.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const pendingNameRef = useRef<string>("image.jpg");

  const acceptsImages = accept.some((e) => IMAGE_EXTS.includes(e));

  const acceptObj = Object.fromEntries(
    accept.map((ext) => [MIME_MAP[ext] ?? "application/octet-stream", [ext]])
  );

  // Revoke the cropper's object URL when it changes or on unmount.
  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  const upload = useCallback(
    async (blob: Blob, sendName: string, displayName: string, image: boolean) => {
      setLoading(true);
      setExtracted(false);
      setIsImageSource(image);
      setFileName(displayName);
      const form = new FormData();
      form.append("file", blob, sendName);
      try {
        const res = await fetch("/api/ai/parse-file", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const msg = formatAPIError(res.status, (err as { error?: string }).error);
          throw new Error(msg);
        }
        const { text } = (await res.json()) as { text: string };
        onExtracted(text, displayName);
        setExtracted(true);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not extract text from file.", { duration: 5000 });
        setFileName(null);
      } finally {
        setLoading(false);
      }
    },
    [onExtracted]
  );

  /** Open the cropper for an image File (from upload or camera). */
  const openCropper = useCallback(
    (f: File) => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
      pendingNameRef.current = jpegName(f.name);
      setCropSrc(URL.createObjectURL(f));
      setShowCropper(true);
    },
    [cropSrc]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (!f) return;
      if (acceptsImages && isImage(f.name)) {
        openCropper(f);
      } else {
        upload(f, f.name, f.name, false);
      }
    },
    [acceptsImages, openCropper, upload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptObj,
    maxFiles: 1,
    maxSize: maxSizeMb * 1024 * 1024,
    noClick: false,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? "File rejected.";
      toast.error(reason);
    },
  });

  const handleCropConfirm = useCallback(
    (blob: Blob) => {
      setShowCropper(false);
      const name = pendingNameRef.current;
      upload(blob, name, name, true);
    },
    [upload]
  );

  const handleCameraCapture = useCallback(
    (f: File) => {
      setShowCamera(false);
      openCropper(f);
    },
    [openCropper]
  );

  function clear(e?: React.MouseEvent) {
    e?.stopPropagation();
    setFileName(null);
    setExtracted(false);
    setIsImageSource(false);
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
    }
  }

  const modals = (
    <>
      {cropSrc && (
        <ImageCropper
          src={cropSrc}
          open={showCropper}
          onConfirm={handleCropConfirm}
          onCancel={() => setShowCropper(false)}
        />
      )}
      {acceptsImages && (
        <CameraCapture
          open={showCamera}
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </>
  );

  if (fileName) {
    const canReCrop = isImageSource && extracted && !!cropSrc;
    return (
      <div className={cn("space-y-2", className)}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3 text-sm",
            extracted && "border-success/40 bg-success/5"
          )}
        >
          {loading ? (
            <Loader2 className="size-5 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <File className={cn("size-5 shrink-0", extracted ? "text-success" : "text-muted-foreground")} />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {loading
                ? hk
                  ? HK_LOADING_MESSAGES.file
                  : bat
                    ? BAT_LOADING_MESSAGES.file
                    : isImageSource
                      ? "Analyzing image with Gemini…"
                      : "Extracting text…"
                : extracted
                  ? "Text extracted successfully"
                  : ""}
            </p>
          </div>
          {canReCrop && (
            <button
              type="button"
              onClick={() => setShowCropper(true)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Re-crop image"
            >
              <Crop className="size-4" />
            </button>
          )}
          {!loading && (
            <button type="button" onClick={clear} className="shrink-0 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        {modals}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-border p-8 text-center text-sm transition-colors hover:border-primary/50 hover:bg-muted/30",
          isDragActive && "border-primary bg-primary/5"
        )}
      >
        <input {...getInputProps()} />
        <Upload className={cn("size-8 text-muted-foreground", isDragActive && "text-primary")} />
        <p className="font-medium">
          {isDragActive ? "Drop the file here" : "Drag & drop or click to upload"}
        </p>
        <p className="text-xs text-muted-foreground">
          {accept.join(", ")} · Max {maxSizeMb}MB
        </p>
      </div>

      {acceptsImages && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowCamera(true)}
        >
          <Camera />
          Capture photo
        </Button>
      )}

      {modals}
    </div>
  );
}
