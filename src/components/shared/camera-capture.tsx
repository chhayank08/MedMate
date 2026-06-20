"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Loader2, SwitchCamera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CameraCaptureProps {
  open: boolean;
  /** Receives the captured frame as an image File (JPEG). */
  onCapture: (file: File) => void;
  onCancel: () => void;
}

/**
 * Live camera capture for laptops, tablets, and phones via getUserMedia. The
 * captured frame is handed back as a JPEG File and then flows through the same
 * cropper → Gemini Vision pipeline as an uploaded image.
 *
 * When getUserMedia is unavailable (older browsers, insecure context) it falls
 * back to the OS camera via a capture-enabled file input.
 */
export function CameraCapture({ open, onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fallbackInputRef = useRef<HTMLInputElement>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Open/refresh the stream while the dialog is open; cleanup stops all tracks.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function begin() {
      if (!navigator.mediaDevices?.getUserMedia) {
        // Fall back to the native OS camera picker.
        fallbackInputRef.current?.click();
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      } catch {
        if (!cancelled) {
          setError("Could not access the camera. Check permissions, or upload an image instead.");
        }
      }
    }

    void begin();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setReady(false);
      setError(null);
    };
  }, [open, facingMode]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  }, [onCapture]);

  const onFallbackFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) onCapture(file);
    },
    [onCapture],
  );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl gap-3 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Capture photo</DialogTitle>
          <DialogDescription>
            Point your camera at the notes, page, or diagram and capture a clear photo.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex h-[55vh] w-full items-center justify-center overflow-hidden rounded-lg bg-black">
          {error ? (
            <p className="px-6 text-center text-sm text-muted-foreground">{error}</p>
          ) : (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                onPlaying={() => setReady(true)}
                className="h-full w-full object-contain"
              />
              {!ready && (
                <Loader2 className="absolute size-6 animate-spin text-muted-foreground" />
              )}
            </>
          )}
        </div>

        <input
          ref={fallbackInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFallbackFile}
          className="hidden"
        />

        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
            disabled={!ready}
          >
            <SwitchCamera />
            Flip
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={capture} disabled={!ready}>
              <Camera />
              Capture
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
