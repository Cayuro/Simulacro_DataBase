import fs from 'fs/promises';
import path from 'path';

// Ruta al CSV (puedes cambiarla si quieres)
const CSV_PATH = path.resolve(process.cwd(), 'data/data_simulated.csv');

function parseCsvLine(line) {
  // Para este CSV funciona split(',') porque no trae comas escapadas en campos
  return line.split(',').map((value) => value.trim());
}

function rowToAppointment(row) {
  return {
    appointmentId: row.appointment_id,
    date: row.appointment_date,
    doctorName: row.doctor_name,
    doctorEmail: row.doctor_email,
    specialty: row.specialty,
    treatmentCode: row.treatment_code,
    treatmentDescription: row.treatment_description,
    treatmentCost: Number(row.treatment_cost),
    insuranceProvider: row.insurance_provider,
    coveragePercentage: Number(row.coverage_percentage),
    amountPaid: Number(row.amount_paid),
  };
}

async function previewPatientHistoryFromCsv() {
  const csvContent = await fs.readFile(CSV_PATH, 'utf-8');
  const lines = csvContent.split(/\r?\n/).filter(Boolean);

  const headers = parseCsvLine(lines[0]);
  const dataLines = lines.slice(1);

  // Convertimos cada línea a objeto { header: value }
  const rows = dataLines.map((line) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index];
    });

    return row;
  });

  // Agrupamos por email de paciente (1 documento Mongo por paciente)
  const groupedByPatient = new Map();

  for (const row of rows) {
    const patientEmail = row.patient_email;

    if (!groupedByPatient.has(patientEmail)) {
      groupedByPatient.set(patientEmail, {
        patientEmail: row.patient_email,
        patientName: row.patient_name,
        appointments: [],
      });
    }

    groupedByPatient.get(patientEmail).appointments.push(rowToAppointment(row));
  }

  const patientDocuments = Array.from(groupedByPatient.values());

  // ── VISTA 1: primeras 3 filas crudas del CSV
  console.log('\n=== Primeras 3 filas del CSV (crudas) ===');
  console.table(rows.slice(0, 3).map((row) => ({
    appointment_id: row.appointment_id,
    patient_email: row.patient_email,
    doctor_name: row.doctor_name,
    treatment_code: row.treatment_code,
    amount_paid: row.amount_paid,
  })));

  // ── VISTA 2: resumen por paciente
  console.log('\n=== Resumen agrupado por paciente ===');
  console.table(patientDocuments.map((doc) => ({
    patientEmail: doc.patientEmail,
    patientName: doc.patientName,
    appointmentsCount: doc.appointments.length,
  })));

  // ── VISTA 3: un documento final como quedaría para Mongo
  console.log('\n=== Ejemplo de documento final (primer paciente) ===');
  console.log(JSON.stringify(patientDocuments[0], null, 2));

  console.log(`\nTotal filas CSV: ${rows.length}`);
  console.log(`Total documentos Mongo (pacientes únicos): ${patientDocuments.length}`);
}

previewPatientHistoryFromCsv().catch((error) => {
  console.error('Error al previsualizar CSV:', error.message);
});
