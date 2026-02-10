-- ==========================================
-- 1. SCORING FUNCTION (Run on REALTIME DB)
-- ==========================================

-- Fungsi untuk menghitung skor satu player atau semua player
-- Asumsi: 
--   - Tabel: game_sessions_rt (current_questions JSONB)
--   - Tabel: game_participants_rt (responses JSONB, score INT)
--   - Logika: Mencocokkan question_id dan answer_id. Jika benar, + skor.

CREATE OR REPLACE FUNCTION calculate_score_new_rt(
  p_session_id TEXT, 
  p_participant_id TEXT DEFAULT NULL -- Jika NULL, hitung semua di sesi
) 
RETURNS VOID AS $$
DECLARE
  v_questions JSONB;
  v_r RECORD;
  v_part_rec RECORD;
  v_score NUMERIC;
  v_total_questions INT;
  v_point_per_question NUMERIC;
BEGIN
  -- Ambil soal dari sesi
  SELECT current_questions INTO v_questions
  FROM game_sessions_rt
  WHERE id = p_session_id;

  IF v_questions IS NULL THEN
    RETURN;
  END IF;

  -- Hitung jumlah soal
  v_total_questions := jsonb_array_length(v_questions);

  IF v_total_questions = 0 THEN
    RETURN;
  END IF;

  -- Hitung poin per soal (total max 100)
  v_point_per_question := 100.0 / v_total_questions;

  -- Loop participant
  FOR v_part_rec IN 
    SELECT id, responses 
    FROM game_participants_rt 
    WHERE session_id = p_session_id 
      AND (p_participant_id IS NULL OR id = p_participant_id)
  LOOP
    v_score := 0;

    -- Loop jawaban player
    IF v_part_rec.responses IS NOT NULL THEN
      FOR v_r IN 
        SELECT * 
        FROM jsonb_to_recordset(v_part_rec.responses)
        AS x(question_id TEXT, answer_id TEXT)
      LOOP
        -- Cek jawaban benar
        IF EXISTS (
          SELECT 1
          FROM jsonb_array_elements(v_questions) AS q
          WHERE q->>'id' = v_r.question_id
            AND q->>'correct' = v_r.answer_id
        ) THEN
          v_score := v_score + v_point_per_question;
        END IF;
      END LOOP;
    END IF;

    -- Amankan skor maksimal 100
    v_score := LEAST(100, ROUND(v_score));

    -- Update skor
    UPDATE game_participants_rt
    SET score = v_score
    WHERE id = v_part_rec.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;


-- ==========================================
-- 2. MERGE FUNCTION (Run on MAIN DB)
-- ==========================================

-- Fungsi untuk menggabungkan data peserta ke Main DB
-- Syarat: Append-only, tidak menimpa jika ID sudah ada (berbasis ID yang unik dalam map/jsonb tersebut)
-- Asumsi:
--   - Tabel: game_sessions (atau sessions)
--   - Kolom: participants (JSONB array)

CREATE OR REPLACE FUNCTION merge_session_participants_main(
  p_session_id TEXT,
  p_new_data JSONB -- Array of objects: [{id:..., score:..., ...}]
)
RETURNS VOID AS $$
DECLARE
  v_existing_data JSONB;
  v_final_data JSONB;
BEGIN
  -- 1. Ambil data existing
  SELECT participants INTO v_existing_data
  FROM game_sessions
  WHERE id = p_session_id;

  IF v_existing_data IS NULL OR jsonb_typeof(v_existing_data) != 'array' THEN
    v_existing_data := '[]'::jsonb;
  END IF;

  -- 2. Lakukan Merge (Hanya insert yang belum ada)
  -- Menggunakan CTE untuk memfilter ID yang sudah ada
  -- Kita membongkar existing dan new, lalu union, tapi prioritaskan existing (agar tidak ditimpa)
  
   WITH existing_rows AS (
       SELECT value FROM jsonb_array_elements(v_existing_data)
   ),
   new_rows AS (
       SELECT value FROM jsonb_array_elements(p_new_data)
   ),
   filtered_new_rows AS (
       SELECT n.value 
       FROM new_rows n
       WHERE NOT EXISTS (
           SELECT 1 FROM existing_rows e 
           WHERE e.value->>'id' = n.value->>'id'
       )
   )
   SELECT jsonb_agg(value) INTO v_final_data
   FROM (
       SELECT value FROM existing_rows
       UNION ALL
       SELECT value FROM filtered_new_rows
   ) all_data;

  -- 3. Update Tabel
  UPDATE game_sessions
  SET participants = COALESCE(v_final_data, v_existing_data) -- Jaga-jaga jika null
  WHERE id = p_session_id;

END;
$$ LANGUAGE plpgsql;
