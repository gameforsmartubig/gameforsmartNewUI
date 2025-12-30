import { supabase } from "./supabase";

// Server time offset untuk sinkronisasi countdown antar device
let serverTimeOffset = 0;
let isOffsetCalculated = false;

/**
 * Fetch waktu server dari database dan hitung offset dengan waktu lokal
 * Menggunakan RPC call ke function get_server_time()
 * Kompensasi network latency dengan mengambil rata-rata round-trip time
 */
export async function calculateServerTimeOffset(): Promise<number> {
  try {
    const clientBefore = Date.now();
    
    const { data, error } = await supabase.rpc("get_server_time");
    
    const clientAfter = Date.now();
    
    if (error) {
      console.error("Error fetching server time:", error);
      return 0;
    }
    
    const serverTime = new Date(data).getTime();
    // Estimasi waktu client saat server memproses request (tengah round-trip)
    const clientTimeEstimate = (clientBefore + clientAfter) / 2;
    
    serverTimeOffset = serverTime - clientTimeEstimate;
    isOffsetCalculated = true;
    
    console.log(`Server time offset calculated: ${serverTimeOffset}ms`);
    
    return serverTimeOffset;
  } catch (err) {
    console.error("Failed to calculate server time offset:", err);
    return 0;
  }
}

/**
 * Hitung offset dari timestamp server yang sudah ada (fallback)
 * Gunakan ini jika RPC call gagal atau tidak tersedia
 */
export function calculateOffsetFromTimestamp(serverTimestamp: string): void {
  const serverTime = new Date(serverTimestamp).getTime();
  const clientTime = Date.now();
  serverTimeOffset = serverTime - clientTime;
  isOffsetCalculated = true;
}

/**
 * Dapatkan waktu sekarang yang sudah dikompensasi dengan offset server
 * Gunakan ini sebagai pengganti Date.now() untuk perhitungan countdown
 */
export function getServerNow(): number {
  return Date.now() + serverTimeOffset;
}

/**
 * Cek apakah offset sudah dihitung
 */
export function isServerOffsetReady(): boolean {
  return isOffsetCalculated;
}

/**
 * Reset offset (untuk testing atau saat session baru)
 */
export function resetServerOffset(): void {
  serverTimeOffset = 0;
  isOffsetCalculated = false;
}

/**
 * Get current offset value (untuk debugging)
 */
export function getServerOffset(): number {
  return serverTimeOffset;
}
