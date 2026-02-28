import fs from 'fs/promises';
import { pool } from '../config/postgres.js';
import { env } from '../config/env.js';

// funcion auxiliar: parsear una linea del CSV
function parseCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

// funcion principal: migrar CSV a PostgreSQL
export async function migrateDataToPostgres() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');  // iniciar transaccion

    // leer el archivo CSV
    const csvPath = env.fileDataCsv;
    const csvContent = await fs.readFile(csvPath, 'utf-8');
    const lines = csvContent.split(/\r?\n/).filter(Boolean);

    const headers = parseCsvLine(lines[0]);
    const dataLines = lines.slice(1);

    // convertir cada linea a objeto
    const rows = dataLines.map((line) => {
      const values = parseCsvLine(line);
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      return row;
    });

    // ── Insertar datos unicos (evitar duplicados con ON CONFLICT)

    // 1. Insertar pacientes
    const patientsMap = new Map();
    for (const row of rows) {
      if (!patientsMap.has(row.patient_email)) {
        patientsMap.set(row.patient_email, {
          name: row.patient_name,
          email: row.patient_email,
          phone: row.patient_phone,
          address: row.patient_address,
        });
      }
    }

    for (const patient of patientsMap.values()) {
      await client.query(
        `INSERT INTO patients (name, email, phone, address)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO NOTHING`,
        [patient.name, patient.email, patient.phone, patient.address]
      );
    }

    // 2. Insertar especialidades
    const specialtiesSet = new Set(rows.map((r) => r.specialty));
    for (const specialty of specialtiesSet) {
      await client.query(
        `INSERT INTO specialitys (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [specialty]
      );
    }

    // 3. Insertar doctores
    const doctorsMap = new Map();
    for (const row of rows) {
      if (!doctorsMap.has(row.doctor_email)) {
        doctorsMap.set(row.doctor_email, {
          name: row.doctor_name,
          email: row.doctor_email,
          specialty: row.specialty,
        });
      }
    }

    for (const doctor of doctorsMap.values()) {
      const specialtyResult = await client.query(
        'SELECT id FROM specialitys WHERE name = $1',
        [doctor.specialty]
      );
      const specialtyId = specialtyResult.rows[0].id;

      await client.query(
        `INSERT INTO doctors (name, email, speciality_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (email) DO NOTHING`,
        [doctor.name, doctor.email, specialtyId]
      );
    }

    // 4. Insertar tratamientos
    const treatmentsMap = new Map();
    for (const row of rows) {
      if (!treatmentsMap.has(row.treatment_code)) {
        treatmentsMap.set(row.treatment_code, {
          code: row.treatment_code,
          description: row.treatment_description,
          cost: parseInt(row.treatment_cost, 10),
        });
      }
    }

    for (const treatment of treatmentsMap.values()) {
      await client.query(
        `INSERT INTO treatments (code, description, cost)
         VALUES ($1, $2, $3)
         ON CONFLICT (code) DO NOTHING`,
        [treatment.code, treatment.description, treatment.cost]
      );
    }

    // 5. Insertar proveedores de seguro
    const insurancesMap = new Map();
    for (const row of rows) {
      if (!insurancesMap.has(row.insurance_provider)) {
        insurancesMap.set(row.insurance_provider, {
          name: row.insurance_provider,
          coverage: parseInt(row.coverage_percentage, 10),
        });
      }
    }

    for (const insurance of insurancesMap.values()) {
      await client.query(
        `INSERT INTO insurances_providers (name, coverage_percentage)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING`,
        [insurance.name, insurance.coverage]
      );
    }

    // 6. Insertar citas (appointments)
    for (const row of rows) {
      const patientResult = await client.query(
        'SELECT id FROM patients WHERE email = $1',
        [row.patient_email]
      );
      const patientId = patientResult.rows[0].id;

      const doctorResult = await client.query(
        'SELECT id FROM doctors WHERE email = $1',
        [row.doctor_email]
      );
      const doctorId = doctorResult.rows[0].id;

      const insuranceResult = await client.query(
        'SELECT id FROM insurances_providers WHERE name = $1',
        [row.insurance_provider]
      );
      const insuranceId = insuranceResult.rows[0].id;

      await client.query(
        `INSERT INTO appointments (id, date, patient_id, doctor_id, treatment_code, insurance_provider_id, amount_paid)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          row.appointment_id,
          row.appointment_date,
          patientId,
          doctorId,
          row.treatment_code,
          insuranceId,
          parseFloat(row.amount_paid),
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Migración a PostgreSQL completada');

    return { success: true, rowsProcessed: rows.length };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
}
