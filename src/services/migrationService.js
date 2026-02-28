import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import { pool } from '../config/postgres.js';
import { env } from '../config/env.js';

// funcion principal: migrar CSV a PostgreSQL
export async function migrateDataToPostgres(clearBefore = false) {
  try {
    // leer el archivo CSV
    const csvPath = resolve(env.fileDataCsv);
    const fileContent = await readFile(csvPath, 'utf-8');
    
    // parsear CSV a objetos (automático con csv-parse)
    const rows = parse(fileContent, {
      columns: true,           // usa la primera fila como nombres de columnas
      skip_empty_lines: true,  // ignora líneas vacías
      trim: true,              // quita espacios en blanco
    });

    console.log(`Leído CSV: ${rows.length} filas`);

    // limpiar datos previos si se solicita
    if (clearBefore) {
      await pool.query('BEGIN');
      await pool.query(`TRUNCATE TABLE patients, treatments, 
        insurances_providers, specialitys, doctors, appointments CASCADE`);
      await pool.query('COMMIT');
      console.log('Datos previos eliminados');
    }

    // sets para evitar duplicados (solo guardamos una vez cada entidad)
    const patientEmails = new Set();
    const doctorEmails = new Set();
    const treatmentCodes = new Set();
    const insuranceNames = new Set();
    const specialtyNames = new Set();

    // recorrer cada fila del CSV
    for (const row of rows) {
      
      // 1. insertar paciente (si no existe)
      const patientEmail = row.patient_email.toLowerCase();
      if (!patientEmails.has(patientEmail)) {
        await pool.query(
          `INSERT INTO patients (name, email, phone, address) 
           VALUES ($1, $2, $3, $4)`,
          [row.patient_name, row.patient_email, row.patient_phone, row.patient_address]
        );
        patientEmails.add(patientEmail);
      }

      // 2. insertar especialidad (si no existe)
      if (!specialtyNames.has(row.specialty)) {
        await pool.query(
          `INSERT INTO specialitys (name) VALUES ($1)`,
          [row.specialty]
        );
        specialtyNames.add(row.specialty);
      }

      // 3. insertar doctor (si no existe)
      if (!doctorEmails.has(row.doctor_email)) {
        // buscar el ID de la especialidad
        const { rows: [specialty] } = await pool.query(
          `SELECT id FROM specialitys WHERE name = $1`,
          [row.specialty]
        );

        await pool.query(
          `INSERT INTO doctors (name, email, speciality_id) 
           VALUES ($1, $2, $3)`,
          [row.doctor_name, row.doctor_email, specialty.id]
        );
        doctorEmails.add(row.doctor_email);
      }

      // 4. insertar tratamiento (si no existe)
      if (!treatmentCodes.has(row.treatment_code)) {
        await pool.query(
          `INSERT INTO treatments (code, description, cost) 
           VALUES ($1, $2, $3)`,
          [row.treatment_code, row.treatment_description, parseInt(row.treatment_cost)]
        );
        treatmentCodes.add(row.treatment_code);
      }

      // 5. insertar seguro (si no existe)
      if (!insuranceNames.has(row.insurance_provider)) {
        await pool.query(
          `INSERT INTO insurances_providers (name, coverage_percentage) 
           VALUES ($1, $2)`,
          [row.insurance_provider, parseInt(row.coverage_percentage)]
        );
        insuranceNames.add(row.insurance_provider);
      }

      // 6. insertar cita (siempre se inserta porque cada fila es una cita única)
      const { rows: [patient] } = await pool.query(
        `SELECT id FROM patients WHERE email = $1`,
        [row.patient_email]
      );

      const { rows: [doctor] } = await pool.query(
        `SELECT id FROM doctors WHERE email = $1`,
        [row.doctor_email]
      );

      const { rows: [insurance] } = await pool.query(
        `SELECT id FROM insurances_providers WHERE name = $1`,
        [row.insurance_provider]
      );

      await pool.query(
        `INSERT INTO appointments (id, date, patient_id, doctor_id, 
         treatment_code, insurance_provider_id, amount_paid) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          row.appointment_id,
          row.appointment_date,
          patient.id,
          doctor.id,
          row.treatment_code,
          insurance.id,
          parseFloat(row.amount_paid),
        ]
      );
    }

    console.log('Migración a PostgreSQL completada');
    return { success: true, rowsProcessed: rows.length };

  } catch (error) {
    console.error('Error en migración PostgreSQL:', error);
    throw error;
  }
}
