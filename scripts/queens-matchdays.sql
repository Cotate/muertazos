-- ============================================================
-- Queens League España Split 6 — Setup completo
-- Ejecutar en el SQL Editor de Supabase.
-- El script es idempotente: borra y recrea las jornadas 1-3.
-- ============================================================

-- ── 0. Verificar equipos antes de ejecutar ─────────────────
-- Ejecuta esto primero para ver qué hay en la tabla:
-- SELECT id, name, logo_file FROM teams
--   WHERE competition_key = 'queens' AND country = 'spain'
--   ORDER BY name;

DO $$
DECLARE
  t_1k           int;
  t_saiyans      int;
  t_pio          int;
  t_balanceadas  int;
  t_troncas      int;
  t_rayo         int;
  t_vellakas     int;
  t_barrio       int;
  t_pilares      int;
  t_mostoles     int;
  t_jijantas     int;
  t_flop         int;
  t_porcinas     int;
  t_madam        int;
  t_sakura       int;
  t_funhadas     int;

  md1_id int;
  md2_id int;
  md3_id int;

  next_order int;
BEGIN

  -- ── 1. Corregir / asegurar logo_file exactos ─────────────
  -- Actualizar nombres de archivo con los valores EXACTOS del disco

  UPDATE teams SET logo_file = '1K FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%1k%';
  UPDATE teams SET logo_file = 'Saiyans FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%saiyans%';
  UPDATE teams SET logo_file = 'PIO FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%pio%';
  UPDATE teams SET logo_file = 'Balanceadas FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%balance%';
  UPDATE teams SET logo_file = 'Las Troncas FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%tronca%';
  UPDATE teams SET logo_file = 'Rayo de Barcelona.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%rayo%';
  UPDATE teams SET logo_file = 'VELLAKAS FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%vellakas%';
  UPDATE teams SET logo_file = 'El Barrio.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%barrio%';
  UPDATE teams SET logo_file = 'Las Pilares FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%pilar%';
  UPDATE teams SET logo_file = 'Ultimate Móstoles.webp'
    WHERE competition_key='queens' AND country='spain' AND (lower(name) LIKE '%mostol%' OR lower(name) LIKE '%móstol%');
  UPDATE teams SET logo_file = 'Jijantas FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%jijanta%';
  UPDATE teams SET logo_file = 'FLOP FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%flop%';
  UPDATE teams SET logo_file = 'Porcinas FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%porcin%';
  UPDATE teams SET logo_file = 'Madam FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%madam%';
  UPDATE teams SET logo_file = 'Sakura FC.webp'
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%sakura%';
  UPDATE teams SET logo_file = 'Fun-Hadas FC.webp'
    WHERE competition_key='queens' AND country='spain'
      AND (lower(name) LIKE '%fun%hada%' OR lower(name) LIKE '%funhada%');

  -- ── 2. Insertar equipos faltantes si no existen ──────────
  INSERT INTO teams (competition_key, country, name, logo_file)
  SELECT 'queens', 'spain', 'VELLAKAS FC', 'VELLAKAS FC.webp'
  WHERE NOT EXISTS (
    SELECT 1 FROM teams
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%vellakas%'
  );

  INSERT INTO teams (competition_key, country, name, logo_file)
  SELECT 'queens', 'spain', 'FLOP FC', 'FLOP FC.webp'
  WHERE NOT EXISTS (
    SELECT 1 FROM teams
    WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%flop%'
  );

  -- ── 3. Resolver IDs de equipos ────────────────────────────
  SELECT id INTO t_1k          FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%1k%'          LIMIT 1;
  SELECT id INTO t_saiyans     FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%saiyans%'     LIMIT 1;
  SELECT id INTO t_pio         FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%pio%'         LIMIT 1;
  SELECT id INTO t_balanceadas FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%balance%'     LIMIT 1;
  SELECT id INTO t_troncas     FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%tronca%'      LIMIT 1;
  SELECT id INTO t_rayo        FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%rayo%'        LIMIT 1;
  SELECT id INTO t_vellakas    FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%vellakas%'    LIMIT 1;
  SELECT id INTO t_barrio      FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%barrio%'      LIMIT 1;
  SELECT id INTO t_pilares     FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%pilar%'       LIMIT 1;
  SELECT id INTO t_mostoles    FROM teams WHERE competition_key='queens' AND country='spain' AND (lower(name) LIKE '%mostol%' OR lower(name) LIKE '%móstol%') LIMIT 1;
  SELECT id INTO t_jijantas    FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%jijanta%'     LIMIT 1;
  SELECT id INTO t_flop        FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%flop%'        LIMIT 1;
  SELECT id INTO t_porcinas    FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%porcin%'      LIMIT 1;
  SELECT id INTO t_madam       FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%madam%'       LIMIT 1;
  SELECT id INTO t_sakura      FROM teams WHERE competition_key='queens' AND country='spain' AND lower(name) LIKE '%sakura%'      LIMIT 1;
  SELECT id INTO t_funhadas    FROM teams WHERE competition_key='queens' AND country='spain'
      AND (lower(name) LIKE '%fun%hada%' OR lower(name) LIKE '%funhada%')                                                        LIMIT 1;

  -- Guardar para diagnóstico
  RAISE NOTICE 'IDs: 1K=%, Saiyans=%, PIO=%, Balanceadas=%, Troncas=%, Rayo=%, Vellakas=%, Barrio=%, Pilares=%, Mostoles=%, Jijantas=%, Flop=%, Porcinas=%, Madam=%, Sakura=%, Funhadas=%',
    t_1k, t_saiyans, t_pio, t_balanceadas, t_troncas, t_rayo, t_vellakas, t_barrio,
    t_pilares, t_mostoles, t_jijantas, t_flop, t_porcinas, t_madam, t_sakura, t_funhadas;

  -- ── 4. Borrar jornadas existentes (idempotente) ──────────
  DELETE FROM matches WHERE matchday_id IN (
    SELECT id FROM matchdays
    WHERE competition_key='queens' AND country='spain'
      AND name IN ('Jornada 1', 'Jornada 2', 'Jornada 3')
  );
  DELETE FROM matchdays
    WHERE competition_key='queens' AND country='spain'
      AND name IN ('Jornada 1', 'Jornada 2', 'Jornada 3');

  -- ── 5. Calcular orden base ─────────────────────────────────
  SELECT COALESCE(MAX(display_order), 0) + 1
    INTO next_order
    FROM matchdays
    WHERE competition_key='queens' AND country='spain';

  -- ── 6. Insertar Jornada 1 ─────────────────────────────────
  INSERT INTO matchdays (competition_key, country, name, date_label, display_order, is_visible, is_locked)
  VALUES ('queens', 'spain', 'Jornada 1', 'Jornada 1', next_order, false, false)
  RETURNING id INTO md1_id;

  INSERT INTO matches (matchday_id, home_team_id, away_team_id, match_order) VALUES
    (md1_id, t_pilares,    t_mostoles,    1),
    (md1_id, t_troncas,    t_rayo,        2),
    (md1_id, t_sakura,     t_funhadas,    3),
    (md1_id, t_porcinas,   t_madam,       4),
    (md1_id, t_saiyans,    t_balanceadas, 5),
    (md1_id, t_jijantas,   t_flop,        6),
    (md1_id, t_1k,         t_pio,         7),
    (md1_id, t_vellakas,   t_barrio,      8);

  -- ── 7. Insertar Jornada 2 ─────────────────────────────────
  INSERT INTO matchdays (competition_key, country, name, date_label, display_order, is_visible, is_locked)
  VALUES ('queens', 'spain', 'Jornada 2', 'Jornada 2', next_order + 1, false, false)
  RETURNING id INTO md2_id;

  INSERT INTO matches (matchday_id, home_team_id, away_team_id, match_order) VALUES
    (md2_id, t_pilares,    t_flop,        1),
    (md2_id, t_rayo,       t_vellakas,    2),
    (md2_id, t_madam,      t_sakura,      3),
    (md2_id, t_1k,         t_balanceadas, 4),
    (md2_id, t_mostoles,   t_jijantas,    5),
    (md2_id, t_porcinas,   t_funhadas,    6),
    (md2_id, t_troncas,    t_barrio,      7),
    (md2_id, t_pio,        t_saiyans,     8);

  -- ── 8. Insertar Jornada 3 ─────────────────────────────────
  INSERT INTO matchdays (competition_key, country, name, date_label, display_order, is_visible, is_locked)
  VALUES ('queens', 'spain', 'Jornada 3', 'Jornada 3', next_order + 2, false, false)
  RETURNING id INTO md3_id;

  INSERT INTO matches (matchday_id, home_team_id, away_team_id, match_order) VALUES
    (md3_id, t_funhadas,    t_madam,       1),
    (md3_id, t_flop,        t_mostoles,    2),
    (md3_id, t_balanceadas, t_pio,         3),
    (md3_id, t_pilares,     t_jijantas,    4),
    (md3_id, t_barrio,      t_rayo,        5),
    (md3_id, t_troncas,     t_vellakas,    6),
    (md3_id, t_porcinas,    t_sakura,      7),
    (md3_id, t_1k,          t_saiyans,     8);

  RAISE NOTICE 'Completado: Jornada 1 (id=%), Jornada 2 (id=%), Jornada 3 (id=%)',
    md1_id, md2_id, md3_id;
END $$;
