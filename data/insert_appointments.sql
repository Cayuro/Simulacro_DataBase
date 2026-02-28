INSERT INTO appointments (
    appointment_date,
    patient_id,
    doctor_id,
    treatment_id,
    insurance_id
)
SELECT
    m.appointment_date,
    p.id_patient,
    d.id_doctor,
    t.id_treatment,
    i.id_insurance
FROM migration m
JOIN patients p ON m.patient_email = p.email
JOIN doctors d ON m.doctor_email = d.email
JOIN treatments t ON m.treatment_code = t.treatment_code
LEFT JOIN insurances i
ON m.insurance_provider = i.name;
