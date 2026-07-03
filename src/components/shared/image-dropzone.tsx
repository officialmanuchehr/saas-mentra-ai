"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { compressImage, validateImageFile } from "@/lib/image-compress";

interface ImageDropzoneProps {
  label: string;
  currentUrl?: string | null;
  maxDimension: number;
  aspectHint?: string;
  shape?: "square" | "wide";
  compact?: boolean;
  disabled?: boolean;
  upload: (file: File) => Promise<string>;
  onUploaded: (url: string) => void;
}

export function ImageDropzone({
  label,
  currentUrl,
  maxDimension,
  aspectHint,
  shape = "square",
  compact = false,
  disabled = false,
  upload,
  onUploaded,
}: ImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    const error = validateImageFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setUploading(true);
    try {
      const blob = await compressImage(file, maxDimension);
      const ext = file.type === "image/png" ? "png" : "jpg";
      const compressedFile = new File([blob], `image.${ext}`, { type: blob.type });
      const url = await upload(compressedFile);
      onUploaded(url);
    } catch {
      toast.error("Не удалось загрузить изображение. Попробуйте снова.");
    } finally {
      setUploading(false);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) handleFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  const isBusy = uploading || disabled;

  return (
    <div className={compact ? "" : "space-y-2"}>
      {!compact && <p className="text-sm font-medium">{label}</p>}
      <button
        type="button"
        onClick={() => !isBusy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!isBusy) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => !isBusy && handleDrop(e)}
        disabled={isBusy}
        aria-label={label}
        className={cn(
          "relative flex items-center justify-center overflow-hidden border-2 border-dashed border-border bg-secondary text-muted-foreground transition-colors hover:border-primary/50",
          shape === "square" ? "aspect-square rounded-2xl" : "aspect-[3/1] w-full rounded-2xl",
          compact && "aspect-square size-20 rounded-xl",
          dragOver && "border-primary bg-primary-light",
          isBusy && "cursor-not-allowed opacity-70"
        )}
      >
        {currentUrl && (
          <Image src={currentUrl} alt={label} fill className="object-cover" />
        )}
        {uploading ? (
          <Loader2 className="relative z-10 size-6 animate-spin text-primary" />
        ) : (
          !currentUrl && (
            <div className="relative z-10 flex flex-col items-center gap-1 px-2 text-center">
              <ImagePlus className={compact ? "size-5" : "size-6"} />
              {!compact && <span className="text-xs">Загрузить фото</span>}
            </div>
          )
        )}
      </button>
      {aspectHint && !compact && (
        <p className="text-xs text-muted-foreground">{aspectHint}</p>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
