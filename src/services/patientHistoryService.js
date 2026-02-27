import { readFile } from "fs/promises";
import { resolve } from "path";
import { parse } from "csv-parse/sync";
import { connectMongoDB } from "../config/mongoDB.js";
import { PatientHistory } from "../models/patientHistoryModel.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

function mapCsvRowToEmbeddedAppointment(row) {
    return {
        appointmentId: row.appointment_id,
        appointmentDate: new Date(row.appointment_date),
        doctorName: row.doctor_name,
        doctorEmail: row.doctor_email,
        specialty: row.specialty,
        treatmentCode: row.treatment_code,
        treatmentDescription: row.treatment_description,
        treatmentCost: Number(row.treatment_cost),
        insuranceProvider: row.insurance_provider,
        coveragePercentage: Number(row.coverage_percentage),
        amountPaid: Number(row.amount_paid)
    };
}

export async function rebuildPatientHistoriesFromCsv(clearBefore = false) {
    const csvPath = resolve(env.fileDataCsv);
    const fileContent = await readFile(csvPath, "utf-8");
    const rows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
    });

    await connectMongoDB();

    if (clearBefore) {
        await PatientHistory.deleteMany({});
    }

    const groupedByPatient = new Map();

    for (const row of rows) {
        const key = row.patient_email;
        if (!key) continue;

        if (!groupedByPatient.has(key)) {
            groupedByPatient.set(key, {
                patientEmail: row.patient_email,
                patientName: row.patient_name,
                patientPhone: row.patient_phone,
                patientAddress: row.patient_address,
                appointments: []
            });
        }

        groupedByPatient.get(key).appointments.push(mapCsvRowToEmbeddedAppointment(row));
    }

    const operations = [];

    for (const patientHistory of groupedByPatient.values()) {
        operations.push({
            updateOne: {
                filter: { patientEmail: patientHistory.patientEmail },
                update: {
                    $set: {
                        patientName: patientHistory.patientName,
                        patientPhone: patientHistory.patientPhone,
                        patientAddress: patientHistory.patientAddress,
                        appointments: patientHistory.appointments
                    }
                },
                upsert: true
            }
        });
    }

    if (operations.length > 0) {
        await PatientHistory.bulkWrite(operations, { ordered: false });
    }

    return {
        rowsRead: rows.length,
        patientsUpserted: operations.length,
        appointmentsEmbedded: rows.length
    };
}

export async function getPatientHistoryByEmail(email) {
    await connectMongoDB();

    const patientHistory = await PatientHistory.findOne({ patientEmail: email }).lean();

    if (!patientHistory) {
        throw new HttpError(404, "Patient history not found");
    }

    return patientHistory;
}

export async function syncDoctorInMongo(oldDoctor, updatedDoctor) {
    await connectMongoDB();

    const oldEmail = oldDoctor.oldEmail;
    if (!oldEmail) return;

    await PatientHistory.updateMany(
        { "appointments.doctorEmail": oldEmail },
        {
            $set: {
                "appointments.$[appointment].doctorEmail": updatedDoctor.newEmail,
                "appointments.$[appointment].doctorName": updatedDoctor.newName,
                "appointments.$[appointment].specialty": updatedDoctor.newSpecialty
            }
        },
        {
            arrayFilters: [{ "appointment.doctorEmail": oldEmail }]
        }
    );
}
