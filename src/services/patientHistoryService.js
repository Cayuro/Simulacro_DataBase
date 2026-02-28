import fs from 'fs/promises';
import { PatientHistory } from '../models/patientHistoryModel.js';
import { env } from '../config/env.js';

// funcion auxiliar: parsear una linea del CSV
function parseCsvLine(line) {
  return line.split(',').map((value) => value.trim());
}

// funcion principal: migrar CSV a MongoDB (historial de pacientes)
export async function migratePatientHistoryToMongo() {
  try {
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

    // agrupar por paciente (1 documento Mongo por paciente)
    const groupedByPatient = new Map();

    for (const row of rows) {
      const patientEmail = row.patient_email;

      // si el paciente no existe en el mapa, crearlo
      if (!groupedByPatient.has(patientEmail)) {
        groupedByPatient.set(patientEmail, {
          patientEmail: row.patient_email,
          patientName: row.patient_name,
          appointments: [],
        });
      }

      // agregar la cita al array de appointments
      groupedByPatient.get(patientEmail).appointments.push({
        appointmentId: row.appointment_id,
        date: new Date(row.appointment_date),  // convertir a Date
        doctorName: row.doctor_name,
        doctorEmail: row.doctor_email,
        specialty: row.specialty,
        treatmentCode: row.treatment_code,
        treatmentDescription: row.treatment_description,
        treatmentCost: parseInt(row.treatment_cost, 10),
        insuranceProvider: row.insurance_provider,
        coveragePercentage: parseInt(row.coverage_percentage, 10),
        amountPaid: parseFloat(row.amount_paid),
      });
    }

    // convertir el Map a array de documentos
    const patientDocuments = Array.from(groupedByPatient.values());

    // guardar o actualizar cada documento en MongoDB
    let created = 0;
    let updated = 0;

    for (const doc of patientDocuments) {
      const existing = await PatientHistory.findOne({ patientEmail: doc.patientEmail });

      if (existing) {
        // si ya existe, agregar solo las citas nuevas
        existing.appointments.push(...doc.appointments);
        await existing.save();
        updated++;
      } else {
        // si no existe, crear nuevo documento
        await PatientHistory.create(doc);
        created++;
      }
    }

    console.log(`✅ Migración a MongoDB completada: ${created} creados, ${updated} actualizados`);

    return { success: true, created, updated };
  } catch (error) {
    console.error('❌ Error en migración MongoDB:', error);
    throw error;
  }
}

// funcion para consultar historial de un paciente por email
export async function getPatientHistoryByEmail(email) {
  const history = await PatientHistory.findOne({ patientEmail: email });
  
  if (!history) {
    return null;
  }

  return history;
}
