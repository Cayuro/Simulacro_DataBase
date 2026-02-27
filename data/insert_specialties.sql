INSERT INTO specialty (description)
SELECT DISTINCT specialty
FROM migration
ON CONFLICT (description) DO NOTHING;