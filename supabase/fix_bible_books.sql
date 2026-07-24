-- Ejecutar solo esto en el SQL Editor de Supabase.
-- Es idempotente: si alguna fila ya existe (por usfm_code) la ignora en vez de fallar.

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
('NT', 66, 'Apocalipsis', 22, 'rev')
on conflict (usfm_code) do nothing;

-- Verificación: debería devolver 66
select count(*) from bible_books;

-- Diagnóstico: bible_books no debería tener RLS habilitado (es data pública).
-- Si relrowsecurity da "true", eso bloquea la API REST aunque el SQL Editor
-- (que corre como superusuario) sí vea las filas.
select relname, relrowsecurity from pg_class where relname = 'bible_books';

-- Fix: desactivar RLS en esta tabla puntual.
alter table bible_books disable row level security;
