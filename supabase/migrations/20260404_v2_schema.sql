-- ============================================================
-- MUERTAZOS v2 — Schema migration
-- Adds: countries, players, jerseys tables
--       country_id FK to teams and matchdays
--       Seeds Spain as default and migrates existing rows
-- ============================================================

-- 1. COUNTRIES
create table if not exists countries (
  id            serial primary key,
  key           text not null unique,   -- 'spain' | 'mexico' | 'brazil'
  name          text not null,
  flag_emoji    text not null default ''
);

insert into countries (key, name, flag_emoji) values
  ('spain',  'España',  '🇪🇸'),
  ('mexico', 'México',  '🇲🇽'),
  ('brazil', 'Brasil',  '🇧🇷')
on conflict (key) do nothing;

-- 2. ADD country_id to teams
alter table teams
  add column if not exists country_id int references countries(id);

-- Back-fill all existing teams → Spain
update teams
set country_id = (select id from countries where key = 'spain')
where country_id is null;

-- 3. ADD country_id to matchdays
alter table matchdays
  add column if not exists country_id int references countries(id);

update matchdays
set country_id = (select id from countries where key = 'spain')
where country_id is null;

-- 4. PLAYERS
create table if not exists players (
  id              serial primary key,
  team_id         int references teams(id) on delete cascade,
  competition_key text not null,           -- 'kings' | 'queens'
  country_id      int references countries(id),
  name            text not null,
  image_file      text not null            -- filename under public/jugadores/{TeamName}/
);

-- 5. JERSEYS
create table if not exists jerseys (
  id              serial primary key,
  team_id         int references teams(id) on delete cascade,
  competition_key text not null,
  country_id      int references countries(id),
  name            text not null,           -- e.g. "Local 2024-25"
  image_file      text not null            -- path under public/jerseys/
);
