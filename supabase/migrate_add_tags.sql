-- Añade etiquetas para poder categorizar peticiones de oración y notas de estudio,
-- igual que ya existe para los versículos guardados.
alter table prayer_requests add column if not exists tags text[] not null default '{}';
alter table study_notes add column if not exists tags text[] not null default '{}';
