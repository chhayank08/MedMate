"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCcw, RotateCw, ZoomIn, ZoomOut, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCroppedImg } from "@/lib/files/crop-image";

interface ImageCropperProps {
  /** Object URL of the image to crop. */
  src: string;
  open: boolean;
  /** Receives the cropped, compressed JPEG blob. */
  onConfirm: (blob: Blob) => void;
  /** Called when the user cancels / re-crops without confirming. */
  onCancel: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

/**
 * Mandatory cropper shown before any image is processed. Lets the user pan,
 * zoom, and rotate to isolate the relevant content (notes, a diagram, a table)
 * and excludes background before sending to Gemini Vision.
 */
export function ImageCropper({ src, open, onConfirm, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  const reset = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setAreaPixels(null);
  }, []);

  const confirm = useCallback(async () => {
    if (!areaPixels) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImg(src, areaPixels, rotation);
      onConfirm(blob);
      reset();
    } finally {
      setProcessing(false);
    }
  }, [areaPixels, src, rotation, onConfirm, reset]);

  const cancel = useCallback(() => {
    reset();
    onCancel();
  }, [reset, onCancel]);

  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
  const rotate = (delta: number) => setRotation((r) => (r + delta + 360) % 360);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !processing) cancel();
      }}
    >
      <DialogContent
        className="max-w-2xl gap-3 sm:max-w-2xl"
        showCloseButton={!processing}
      >
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>
            Drag to reposition, then zoom or rotate to focus on the content you want to study.
          </DialogDescription>
        </DialogHeader>

        <div className="relative h-[55vh] w-full overflow-hidden rounded-lg bg-muted">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={3 / 4}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={(z) => setZoom(clampZoom(z))}
            onRotationChange={setRotation}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setZoom((z) => clampZoom(z - 0.2))}
            disabled={processing || zoom <= MIN_ZOOM}
            aria-label="Zoom out"
          >
            <ZoomOut />
          </Button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(clampZoom(Number(e.target.value)))}
            disabled={processing}
            aria-label="Zoom"
            className="h-1 flex-1 cursor-pointer accent-primary"
          />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setZoom((z) => clampZoom(z + 0.2))}
            disabled={processing || zoom >= MAX_ZOOM}
            aria-label="Zoom in"
          >
            <ZoomIn />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => rotate(-90)}
            disabled={processing}
            aria-label="Rotate left"
          >
            <RotateCcw />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => rotate(90)}
            disabled={processing}
            aria-label="Rotate right"
          >
            <RotateCw />
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={cancel} disabled={processing}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm} disabled={processing || !areaPixels}>
            {processing ? (
              <>
                <Loader2 className="animate-spin" />
                Processing…
              </>
            ) : (
              "Confirm crop"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
