import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export async function uploadImage(file: File, folder: string = "quiz_images"): Promise<string | null> {
  try {
    console.log("Starting upload for file:", file.name, "Size:", file.size);
    
    // Validate file
    if (!file) {
      console.error("No file provided");
      return null;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      console.error("File too large:", file.size);
      alert("File terlalu besar. Maksimal 5MB.");
      return null;
    }

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      console.error("Invalid file type:", file.type);
      alert("File harus berupa gambar (PNG, JPG, GIF, WebP).");
      return null;
    }

    // Generate a unique file name
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    console.log("Uploading to path:", filePath);

    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
      console.error("Supabase not configured properly");
      alert("Konfigurasi Supabase belum lengkap. Silakan hubungi administrator.");
      return null;
    }

    // Upload the file to Supabase storage
    const { data, error } = await supabase.storage
      .from("quiz_images")
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error("Error uploading image:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Handle specific errors
      if (error.message?.includes('Bucket not found')) {
        alert("Storage bucket belum dibuat. Silakan hubungi administrator untuk setup storage.");
      } else if (error.message?.includes('Insufficient permissions')) {
        alert("Tidak memiliki izin untuk upload gambar. Silakan login ulang.");
      } else if (error.message?.includes('File already exists')) {
        alert("File dengan nama yang sama sudah ada. Silakan coba lagi.");
      } else {
        alert("Gagal upload gambar: " + (error.message || "Unknown error"));
      }
      return null;
    }

    console.log("Upload successful:", data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("quiz_images")
      .getPublicUrl(filePath);

    const publicUrl = urlData?.publicUrl;
    console.log("Public URL:", publicUrl);

    return publicUrl || null;
  } catch (error) {
    console.error("Error in uploadImage:", error);
    alert("Terjadi kesalahan saat upload gambar. Silakan coba lagi.");
    return null;
  }
}

export function getImageNameFromUrl(url: string | null): string {
  if (!url) return "No image";
  
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const fileName = pathParts[pathParts.length - 1];
    
    // Return just the filename without extension
    return fileName.split(".")[0].substring(0, 8) + "...";
  } catch (e) {
    return "Invalid URL";
  }
} 