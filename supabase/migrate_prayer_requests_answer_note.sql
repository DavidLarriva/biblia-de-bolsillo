-- Permite guardar cómo fue respondida una oración (testimonio), no solo
-- marcarla como respondida sin más detalle.
alter table prayer_requests add column if not exists answer_note text;
