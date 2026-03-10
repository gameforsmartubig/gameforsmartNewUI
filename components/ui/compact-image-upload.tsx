"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "./button";
import { Trash2, ImageIcon, Upload } from "lucide-react";
import { uploadImage } from "@/lib/upload-image";
import { cn } from "@/lib/utils";
import { compressImage, createCompressedPreview, validateImageFile } from "@/lib/image-compression";

interface CompactImageUploadProps {
  imageUrl: string | null;
  onImageChange: (url: string | null) => void;
  className?: string;
  cacheKey?: string; // For localStorage caching
}

export default function CompactImageUpload({ 
  imageUrl, 
  onImageChange, 
  className,
  cacheKey
}: CompactImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uniqueId] = useState(() => `image-upload-${Math.random().toString(36).slice(2)}`);

  // Load from localStorage on mount
  useEffect(() => {
    if (cacheKey && !imageUrl) {
      const cachedUrl = localStorage.getItem(`compact_image_${cacheKey}`);
      if (cachedUrl) {
        onImageChange(cachedUrl);
      }
    }
  }, [cacheKey, imageUrl, onImageChange]);

  // Save to localStorage when imageUrl changes
  useEffect(() => {
    if (cacheKey && imageUrl) {
      localStorage.setItem(`compact_image_${cacheKey}`, imageUrl);
    } else if (cacheKey && !imageUrl) {
      localStorage.removeItem(`compact_image_${cacheKey}`);
    }
  }, [cacheKey, imageUrl]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      // Create compressed preview immediately
      const previewUrl = await createCompressedPreview(file, {
        maxWidth: 200,
        maxHeight: 200,
        quality: 0.7
      });
      setPreviewUrl(previewUrl);

      // Compress the file for upload
      const compressedFile = await compressImage(file);
      console.log(`Compact image compressed: ${file.size} bytes -> ${compressedFile.size} bytes`);

      // Auto-upload the compressed file
      setIsUploading(true);
      
      const url = await uploadImage(compressedFile);
      if (url) {
        onImageChange(url);
        setPreviewUrl(null); // Clear preview since we have the actual URL
      } else {
        setError("Failed to upload image.");
      }
    } catch (processingError) {
      console.error("Error processing image:", processingError);
      setError("Failed to process image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    setPreviewUrl(null);
    setError(null);
  };

  // Determine which image to show - preview or uploaded
  const displayImageUrl = imageUrl || previewUrl;

  return (
    <div className={cn("relative", className)}>
      {displayImageUrl ? (
        <div className="relative group">
          <div className="relative w-full h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
            <Image 
              src={displayImageUrl} 
              alt={previewUrl ? "Image preview" : "Answer image"}
              fill
              className="object-cover"
            />
            {/* Show uploading overlay if preview is showing and uploading */}
            {previewUrl && isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleRemoveImage}
                className="h-6 w-6 p-0"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="sr-only"
            id={uniqueId}
            disabled={isUploading}
          />
          <label
            htmlFor={uniqueId}
            className={cn(
              "block w-full h-16 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors",
              "flex items-center justify-center bg-slate-50 hover:bg-slate-100",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                <span className="text-xs">Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-slate-500">
                <Upload className="w-3 h-3" />
                <span className="text-xs">Add Image</span>
              </div>
            )}
          </label>
        </div>
      )}
      
      {error && (
        <div className="text-xs text-red-500 mt-1">{error}</div>
      )}
      
      {previewUrl && !imageUrl && (
        <div className="text-xs text-blue-500 mt-1">
          {isUploading ? "Auto-uploading..." : "Image ready"}
        </div>
      )}
    </div>
  );
}
