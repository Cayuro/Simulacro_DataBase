INSERT INTO patients (name, email, phone, address, insurance_id)
SELECT DISTINCT
    m.patient_name,
    m.patient_email,
    m.patient_phone,
    m.patient_address,
    i.id_insurance
FROM migration m
LEFT JOIN insurances i
ON m.insurance_provider = i.name
ON CONFLICT (email) DO NOTHING;