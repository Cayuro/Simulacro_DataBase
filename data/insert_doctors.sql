INSERT INTO doctors (name, email, id_specialty)
SELECT DISTINCT
    m.doctor_name,
    m.doctor_email,
    s.id_specialty
FROM migration m
LEFT JOIN specialty s
ON m.specialty = s.description
ON CONFLICT (email) DO NOTHING;