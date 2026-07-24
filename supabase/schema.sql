-- Biblia de bolsillo — esquema de base de datos
create extension if not exists pgcrypto;

-- 1. bible_books (referencia estática, sin RLS de usuario)
create table bible_books (
  id serial primary key,
  testament text not null check (testament in ('AT', 'NT')),
  order_num int not null,
  name text not null,
  chapters_count int not null,
  usfm_code text not null unique
);

insert into bible_books (testament, order_num, name, chapters_count, usfm_code) values
('AT', 1, 'Génesis', 50, 'gen'),
('AT', 2, 'Éxodo', 40, 'exo'),
('AT', 3, 'Levítico', 27, 'lev'),
('AT', 4, 'Números', 36, 'num'),
('AT', 5, 'Deuteronomio', 34, 'deu'),
('AT', 6, 'Josué', 24, 'jos'),
('AT', 7, 'Jueces', 21, 'jdg'),
('AT', 8, 'Rut', 4, 'rut'),
('AT', 9, '1 Samuel', 31, '1sa'),
('AT', 10, '2 Samuel', 24, '2sa'),
('AT', 11, '1 Reyes', 22, '1ki'),
('AT', 12, '2 Reyes', 25, '2ki'),
('AT', 13, '1 Crónicas', 29, '1ch'),
('AT', 14, '2 Crónicas', 36, '2ch'),
('AT', 15, 'Esdras', 10, 'ezr'),
('AT', 16, 'Nehemías', 13, 'neh'),
('AT', 17, 'Ester', 10, 'est'),
('AT', 18, 'Job', 42, 'job'),
('AT', 19, 'Salmos', 150, 'psa'),
('AT', 20, 'Proverbios', 31, 'pro'),
('AT', 21, 'Eclesiastés', 12, 'ecc'),
('AT', 22, 'Cantares', 8, 'sng'),
('AT', 23, 'Isaías', 66, 'isa'),
('AT', 24, 'Jeremías', 52, 'jer'),
('AT', 25, 'Lamentaciones', 5, 'lam'),
('AT', 26, 'Ezequiel', 48, 'ezk'),
('AT', 27, 'Daniel', 12, 'dan'),
('AT', 28, 'Oseas', 14, 'hos'),
('AT', 29, 'Joel', 3, 'jol'),
('AT', 30, 'Amós', 9, 'amo'),
('AT', 31, 'Abdías', 1, 'oba'),
('AT', 32, 'Jonás', 4, 'jon'),
('AT', 33, 'Miqueas', 7, 'mic'),
('AT', 34, 'Nahúm', 3, 'nam'),
('AT', 35, 'Habacuc', 3, 'hab'),
('AT', 36, 'Sofonías', 3, 'zep'),
('AT', 37, 'Hageo', 2, 'hag'),
('AT', 38, 'Zacarías', 14, 'zec'),
('AT', 39, 'Malaquías', 4, 'mal'),
('NT', 40, 'Mateo', 28, 'mat'),
('NT', 41, 'Marcos', 16, 'mrk'),
('NT', 42, 'Lucas', 24, 'luk'),
('NT', 43, 'Juan', 21, 'jhn'),
('NT', 44, 'Hechos', 28, 'act'),
('NT', 45, 'Romanos', 16, 'rom'),
('NT', 46, '1 Corintios', 16, '1co'),
('NT', 47, '2 Corintios', 13, '2co'),
('NT', 48, 'Gálatas', 6, 'gal'),
('NT', 49, 'Efesios', 6, 'eph'),
('NT', 50, 'Filipenses', 4, 'php'),
('NT', 51, 'Colosenses', 4, 'col'),
('NT', 52, '1 Tesalonicenses', 5, '1th'),
('NT', 53, '2 Tesalonicenses', 3, '2th'),
('NT', 54, '1 Timoteo', 6, '1ti'),
('NT', 55, '2 Timoteo', 4, '2ti'),
('NT', 56, 'Tito', 3, 'tit'),
('NT', 57, 'Filemón', 1, 'phm'),
('NT', 58, 'Hebreos', 13, 'heb'),
('NT', 59, 'Santiago', 5, 'jas'),
('NT', 60, '1 Pedro', 5, '1pe'),
('NT', 61, '2 Pedro', 3, '2pe'),
('NT', 62, '1 Juan', 5, '1jn'),
('NT', 63, '2 Juan', 1, '2jn'),
('NT', 64, '3 Juan', 1, '3jn'),
('NT', 65, 'Judas', 1, 'jud'),
('NT', 66, 'Apocalipsis', 22, 'rev');

-- 2. profiles
create table profiles (
  id uuid primary key references auth.users(id),
  display_name text,
  longest_streak int default 0,
  preferred_bible_version text default 'rvr1960' check (preferred_bible_version in ('ntv', 'rvr1960')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select_own" on profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- 3. reading_progress
create table reading_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  book_id int references bible_books(id),
  chapter int,
  completed_at date default current_date,
  created_at timestamptz default now(),
  unique (user_id, book_id, chapter)
);

alter table reading_progress enable row level security;

create policy "reading_progress_select_own" on reading_progress
  for select using (auth.uid() = user_id);

create policy "reading_progress_insert_own" on reading_progress
  for insert with check (auth.uid() = user_id);

create policy "reading_progress_update_own" on reading_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "reading_progress_delete_own" on reading_progress
  for delete using (auth.uid() = user_id);

-- 4. saved_verses
create table saved_verses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  reference text,
  verse_text text,
  bible_version text check (bible_version in ('ntv', 'rvr1960') or bible_version is null),
  notes text,
  tags text[] default '{}',
  is_memorizing boolean default false,
  memorize_status text check (memorize_status in ('en_proceso', 'memorizado') or memorize_status is null),
  created_at timestamptz default now()
);

alter table saved_verses enable row level security;

create policy "saved_verses_select_own" on saved_verses
  for select using (auth.uid() = user_id);

create policy "saved_verses_insert_own" on saved_verses
  for insert with check (auth.uid() = user_id);

create policy "saved_verses_update_own" on saved_verses
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "saved_verses_delete_own" on saved_verses
  for delete using (auth.uid() = user_id);

-- 5. journal_entries
create table journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  entry_date date default current_date,
  content text,
  linked_verse_id uuid references saved_verses(id) on delete set null,
  created_at timestamptz default now()
);

alter table journal_entries enable row level security;

create policy "journal_entries_select_own" on journal_entries
  for select using (auth.uid() = user_id);

create policy "journal_entries_insert_own" on journal_entries
  for insert with check (auth.uid() = user_id);

create policy "journal_entries_update_own" on journal_entries
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "journal_entries_delete_own" on journal_entries
  for delete using (auth.uid() = user_id);

-- 6. prayer_requests
create table prayer_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  content text,
  status text default 'pendiente' check (status in ('pendiente', 'respondida')),
  created_at timestamptz default now(),
  answered_at timestamptz
);

alter table prayer_requests enable row level security;

create policy "prayer_requests_select_own" on prayer_requests
  for select using (auth.uid() = user_id);

create policy "prayer_requests_insert_own" on prayer_requests
  for insert with check (auth.uid() = user_id);

create policy "prayer_requests_update_own" on prayer_requests
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "prayer_requests_delete_own" on prayer_requests
  for delete using (auth.uid() = user_id);

-- 7. study_notes
create table study_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  note_date date default current_date,
  title text,
  passage text,
  content text,
  created_at timestamptz default now()
);

alter table study_notes enable row level security;

create policy "study_notes_select_own" on study_notes
  for select using (auth.uid() = user_id);

create policy "study_notes_insert_own" on study_notes
  for insert with check (auth.uid() = user_id);

create policy "study_notes_update_own" on study_notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "study_notes_delete_own" on study_notes
  for delete using (auth.uid() = user_id);

-- 8. spiritual_goals
create table spiritual_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  title text,
  description text,
  status text default 'pendiente' check (status in ('pendiente', 'en_progreso', 'cumplida')),
  target_date date,
  created_at timestamptz default now()
);

alter table spiritual_goals enable row level security;

create policy "spiritual_goals_select_own" on spiritual_goals
  for select using (auth.uid() = user_id);

create policy "spiritual_goals_insert_own" on spiritual_goals
  for insert with check (auth.uid() = user_id);

create policy "spiritual_goals_update_own" on spiritual_goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "spiritual_goals_delete_own" on spiritual_goals
  for delete using (auth.uid() = user_id);

-- 9. bible_text_cache (caché compartido de contenido público de la API)
create table bible_text_cache (
  id serial primary key,
  version text check (version in ('ntv', 'rvr1960')),
  book_usfm text,
  chapter int,
  versiculos jsonb,
  fetched_at timestamptz default now(),
  unique (version, book_usfm, chapter)
);

alter table bible_text_cache enable row level security;

create policy "bible_text_cache_select_authenticated" on bible_text_cache
  for select to authenticated using (true);

create policy "bible_text_cache_insert_authenticated" on bible_text_cache
  for insert to authenticated with check (true);
