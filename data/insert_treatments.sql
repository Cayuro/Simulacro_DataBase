INSERT INTO treatments (description, cost, treatment_code)
SELECT DISTINCT treatment_description, treatment_cost, treatment_code
FROM migration
ON CONFLICT (treatment_code) DO NOTHING;