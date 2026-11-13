-- Compare output privately while the source is quiescent. No raw rows are emitted.
\set ON_ERROR_STOP on
BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY;
SET LOCAL search_path = pg_catalog;
SET LOCAL TIME ZONE 'UTC';
SET LOCAL DateStyle = 'ISO, YMD';
SET LOCAL IntervalStyle = 'postgres';
SET LOCAL bytea_output = 'hex';
SET LOCAL extra_float_digits = 3;
SET LOCAL row_security = off;

-- Emit counts and ordered row hashes. Sorting the hashes preserves duplicates
-- and makes the result independent of the physical row order after a restore.
SELECT format('SELECT %L, count(*) FROM %I.%I;
               SELECT encode(sha256(convert_to(to_jsonb(row_data)::text, ''UTF8'')), ''hex'') COLLATE "C" AS row_hash
               FROM %I.%I AS row_data ORDER BY row_hash;',
              'table ' || tablename, schemaname, tablename, schemaname, tablename)
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename COLLATE "C"
\gexec

-- Sequence ownership and definitions are compared in the schema-only dumps.
SELECT format('SELECT %L, last_value, is_called FROM %I.%I;',
              'sequence ' || sequencename, schemaname, sequencename)
FROM pg_sequences
WHERE schemaname = 'public'
ORDER BY sequencename COLLATE "C"
\gexec
COMMIT;
