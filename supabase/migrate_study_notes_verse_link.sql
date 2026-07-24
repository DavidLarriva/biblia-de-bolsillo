-- Reemplaza el campo de texto libre "passage" en study_notes por un vínculo
-- real a un versículo guardado (mismo patrón que journal_entries.linked_verse_id),
-- para poder elegirlo de una lista en vez de escribirlo a mano.

alter table study_notes drop column if exists passage;

alter table study_notes
  add column linked_verse_id uuid references saved_verses(id) on delete set null;
