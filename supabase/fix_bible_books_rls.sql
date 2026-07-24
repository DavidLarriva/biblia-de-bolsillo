-- Corrige el issue "Table publicly accessible" del Security Advisor de Supabase.
-- bible_books es contenido público de solo lectura (los 66 libros), pero sin RLS
-- también quedaba abierta a insert/update/delete desde la clave anon.
-- Esto habilita RLS con una policy de solo lectura; al no agregar policies de
-- escritura, insert/update/delete quedan bloqueados por defecto para todos.

alter table bible_books enable row level security;

create policy "bible_books_select_public" on bible_books
  for select using (true);
