"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Trash2, ImageIcon, Upload } from "lucide-react";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import {
  compressImage,
  createCompressedPreview,
  validateImageFile,
} from "@/lib/image-compression";

interface ImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  className?: string;
  label?: string;
  cacheKey?: string; // For localStorage caching
}

export default function ImageUpload({
  imageUrl,
  onImageChange,
  className,
  label = "Image",
  cacheKey,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    if (cacheKey && !imageUrl) {
      const cachedUrl = localStorage.getItem(`image_${cacheKey}`);
      if (cachedUrl) {
        onImageChange(cachedUrl);
      }
    }
  }, [cacheKey, imageUrl, onImageChange]);

  // Save to localStorage when imageUrl changes
  useEffect(() => {
    if (cacheKey && imageUrl) {
      localStorage.setItem(`image_${cacheKey}`, imageUrl);
    } else if (cacheKey && !imageUrl) {
      localStorage.removeItem(`image_${cacheKey}`);
    }
  }, [cacheKey, imageUrl]);

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || "Invalid file");
      return;
    }

    try {
      // Create compressed preview immediately
      const previewUrl = await createCompressedPreview(file);
      setPreviewUrl(previewUrl);

      // Compress the file for upload
      const compressedFile = await compressImage(file);
      console.log(
        `Image compressed: ${file.size} bytes -> ${compressedFile.size} bytes`
      );

      // Auto-upload the compressed file
      handleUploadSuccess(compressedFile);
    } catch (error) {
      console.error("Error processing image:", error);
      setError("Failed to process image. Please try again.");
    }
  };

  const handleUploadSuccess = async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      const url = await uploadImage(file);
      if (url) {
        onImageChange(url);
        setPreviewUrl(null); // Clear preview since we have the actual URL
        setSelectedFile(null);
      } else {
        setError("Failed to upload image. Please try again.");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("An error occurred while uploading the image.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setPreviewUrl(null);
    setSelectedFile(null);
    setError(null);
  };

  // Determine which image to show - preview or uploaded
  const displayImageUrl = imageUrl || previewUrl;
  const showUploadButton = !displayImageUrl;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="text-sm font-medium text-gray-700">{label}</div>

      {displayImageUrl ? (
        <div className="relative w-full max-w-sm mx-auto">
          <div className="group relative w-full rounded-xl bg-white dark:bg-black ring-1 ring-gray-200 dark:ring-white/10 p-0.5">
            <div className="absolute inset-x-0 -top-px h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
            <div className="relative w-full rounded-[10px] bg-gray-50/50 dark:bg-white/[0.02] p-1.5">
              <div className="relative mx-auto w-full overflow-hidden rounded-lg border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-black/50">
                <div className="relative h-[240px] flex items-center justify-center">
                  <Image
                    src={displayImageUrl}
                    alt={previewUrl ? "Image preview" : "Uploaded image"}
                    fill
                    className="object-contain"
                  />
                  {/* Show uploading overlay if preview is showing and uploading */}
                  {previewUrl && isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <div className="text-sm">Uploading...</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileSelect(file);
              }
            }}
            className="sr-only"
            id="image-upload-input"
            disabled={isUploading}
          />
          <label
            htmlFor="image-upload-input"
            className={cn(
              "block w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors",
              "flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <div className="flex flex-col items-center space-y-2 text-blue-600">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2 text-slate-500">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">
                  Click to upload image
                </span>
                <span className="text-xs">
                  PNG, JPG, GIF, WEBP up to 10MB (auto-compressed)
                </span>
              </div>
            )}
          </label>
        </div>
      )}

      {error && <div className="text-sm text-red-500 mt-1">{error}</div>}

      {previewUrl && !imageUrl && (
        <div className="text-sm text-blue-500 mt-1">
          {isUploading ? "Auto-uploading image..." : "Image ready for upload"}
        </div>
      )}
    </div>
  );
}
