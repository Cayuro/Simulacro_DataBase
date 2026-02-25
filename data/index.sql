CREATE INDEX IF NOT EXISTS idx_patients_email
ON patients(email);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
ON appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_insurances_name
ON insurances(name);