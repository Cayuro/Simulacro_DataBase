CREATE INDEX IF NOT EXISTS idx_patients_email
ON patients(email);

CREATE INDEX IF NOT EXISTS idx_doctors_email
ON doctors(email);

CREATE INDEX IF NOT EXISTS idx_doctors_specialty
ON doctors(id_specialty);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_id
ON appointments(patient_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id
ON appointments(doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_date
ON appointments(appointment_date);

CREATE INDEX IF NOT EXISTS idx_appointments_patient_date
ON appointments(patient_id, appointment_date DESC);

DROP INDEX IF EXISTS uidx_appointments_code_not_null;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_appointments_code
ON appointments(appointment_code);

CREATE INDEX IF NOT EXISTS idx_treatments_code
ON treatments(treatment_code);

CREATE INDEX IF NOT EXISTS idx_insurances_name
ON insurances(name);