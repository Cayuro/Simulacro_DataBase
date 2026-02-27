INSERT INTO insurances (name, coverage_percentage)
SELECT DISTINCT insurance_provider, coverage_percentage
FROM migration
ON CONFLICT (name) DO NOTHING;