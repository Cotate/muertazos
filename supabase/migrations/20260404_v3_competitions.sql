-- ============================================================
-- MUERTAZOS v3 — Competitions & team_collections migration
-- Adds: competitions table, team_collections table
--       competition_id + country_id to teams (non-destructive)
-- ============================================================

-- 1. COMPETITIONS
create table if not exists competitions (
  id    serial primary key,
  name  text not null,
  type  text not null check (type in ('kings', 'queens'))
);

insert into competitions (name, type) values
  ('Kings League España',  'kings'),
  ('Queens League España', 'queens'),
  ('Kings League México',  'kings'),
  ('Kings League Brasil',  'kings')
on conflict do nothing;

-- 2. Ensure countries table exists (created in v2 migration)
-- countries: spain=1, mexico=2, brazil=3

-- 3. ADD competition_id to teams (non-destructive)
alter table teams
  add column if not exists competition_id int references competitions(id);

-- Back-fill existing Kings teams → Kings League España (id=1)
update teams
set competition_id = (select id from competitions where name = 'Kings League España')
where competition_key = 'kings' and competition_id is null;

-- Back-fill existing Queens teams → Queens League España (id=2)
update teams
set competition_id = (select id from competitions where name = 'Queens League España')
where competition_key = 'queens' and competition_id is null;

-- 4. TEAM_COLLECTIONS
-- Links teams to (competition, country) combos for cross-country support
create table if not exists team_collections (
  id              serial primary key,
  competition_id  int not null references competitions(id),
  country_id      int not null references countries(id),
  team_id         int not null references teams(id) on delete cascade,
  unique (competition_id, country_id, team_id)
);

-- Seed Spain Kings teams into team_collections
insert into team_collections (competition_id, country_id, team_id)
select
  (select id from competitions where name = 'Kings League España'),
  (select id from countries where key = 'spain'),
  t.id
from teams t
where t.competition_key = 'kings'
on conflict do nothing;

-- Seed Spain Queens teams into team_collections
insert into team_collections (competition_id, country_id, team_id)
select
  (select id from competitions where name = 'Queens League España'),
  (select id from countries where key = 'spain'),
  t.id
from teams t
where t.competition_key = 'queens'
on conflict do nothing;
