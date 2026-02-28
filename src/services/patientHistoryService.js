import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { parse } from 'csv-parse/sync';
import { PatientHistory } from '../models/patientHistoryModel.js';
import { env } from '../config/env.js';

// funcion principal: migrar CSV a MongoDB (historial de pacientes)
export async function migratePatientHistoryToMongo() {
  try {
    // leer el archivo CSV
    const csvPath = resolve(env.fileDataCsv);
    const fileContent = await readFile(csvPath, 'utf-8');
    
    // parsear CSV a objetos
    const rows = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Leído CSV: ${rows.length} filas`);

    // crear un objeto para agrupar citas por paciente
    const patientsByEmail = {};

    // recorrer cada fila del CSV
    for (const row of rows) {
      const email = row.patient_email;

      // si el paciente no existe en el objeto, crearlo
      if (!patientsByEmail[email]) {
        patientsByEmail[email] = {
          patientEmail: row.patient_email,
          patientName: row.patient_name,
          appointments: [],
        };
      }

      // agregar la cita al array de appointments del paciente
      patientsByEmail[email].appointments.push({
        appointmentId: row.appointment_id,
        date: new Date(row.appointment_date),
        doctorName: row.doctor_name,
        doctorEmail: row.doctor_email,
        specialty: row.specialty,
        treatmentCode: row.treatment_code,
        treatmentDescription: row.treatment_description,
        treatmentCost: parseInt(row.treatment_cost),
        insuranceProvider: row.insurance_provider,
        coveragePercentage: parseInt(row.coverage_percentage),
        amountPaid: parseFloat(row.amount_paid),
      });
    }

    // convertir el objeto a array de documentos
    const patientDocuments = Object.values(patientsByEmail);

    // guardar cada paciente en MongoDB
    let created = 0;
    let updated = 0;

    for (const doc of patientDocuments) {
      // buscar si el paciente ya existe
      const existing = await PatientHistory.findOne({ patientEmail: doc.patientEmail });

      if (existing) {
        // si existe, agregar las citas nuevas
        existing.appointments.push(...doc.appointments);
        await existing.save();
        updated++;
      } else {
        // si no existe, crear nuevo documento
        await PatientHistory.create(doc);
        created++;
      }
    }

    console.log(`Migración a MongoDB: ${created} creados, ${updated} actualizados`);
    return { success: true, created, updated };

  } catch (error) {
    console.error('Error en migración MongoDB:', error);
    throw error;
  }
}

// funcion para consultar historial de un paciente por email
export async function getPatientHistoryByEmail(email) {
  const history = await PatientHistory.findOne({ patientEmail: email });
  return history;  // devuelve null si no existe
}
