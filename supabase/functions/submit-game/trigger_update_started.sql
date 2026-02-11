-- ==========================================
-- TRIGGER: Update Participant Start Time Automatically
-- ==========================================

-- Fungsi ini dijalankan ketika status sesi berubah menjadi 'active'.
-- Tujuannya adalah menyetel waktu mulai ('started') untuk SEMUA peserta di sesi tersebut secara serentak.
-- Ini memastikan fairness (waktu mulai dihitung dari server, bukan client).

CREATE OR REPLACE FUNCTION fn_update_participants_start()
RETURNS TRIGGER AS $$
BEGIN
    -- Cek apakah status berubah menjadi 'active'
    -- (OLD.status IS DISTINCT FROM NEW.status) memastikan trigger hanya jalan jika nilai benar-benar berubah
    IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM 'active') THEN
        
        -- Update semua peserta di sesi ini
        -- Set 'started' ke waktu sekarang (NOW())
        -- Hanya update jika 'started' belum terisi (untuk menghindari overwrite jika game di-pause/resume)
        -- ATAU: Jika Anda ingin mereset waktu setiap kali status jadi active, hapus kondisi "started IS NULL"
        -- Di sini saya asumsikan kita ingin mereset waktu agar durasi dihitung dari sesi aktif terakhir (jika restart).
        -- Tapi jika pause/resume, mungkin logika lain diperlukan. 
        -- Untuk amannya, kita timpa saja (overwrite) agar sinkron dengan waktu mulai sesi.
        
        UPDATE game_participants_rt
        SET started = NOW()
        WHERE session_id = NEW.id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Hapus trigger lama jika ada (untuk mencegah duplikasi)
DROP TRIGGER IF EXISTS tr_session_active_start ON game_sessions_rt;

-- Pasang Trigger pada tabel game_sessions_rt
CREATE TRIGGER tr_session_active_start
AFTER UPDATE ON game_sessions_rt
FOR EACH ROW
EXECUTE FUNCTION fn_update_participants_start();
