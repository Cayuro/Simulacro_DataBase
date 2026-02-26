INSERT INTO patients (name, email, phone, address, insurance_id)
SELECT DISTINCT
    m.patient_name,
    m.patient_email,
    m.patient_phone,
    m.patient_address
FROM migration m
ON CONFLICT (email) DO NOTHING;