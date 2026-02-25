import {access, readFile} from "fs/promises";
import { pool } from "../config/postgres.js";
import { parse } from "csv-parse/sync";
import { env } from "../config/env.js";
import { resolve } from "path";

export async function loadMigrationData() {
    const candidatePaths = [
        resolve(process.cwd(), env.fileDataCsv),
        resolve(process.cwd(), env.fileDataCsv.replace(/^\.data\//, "./data/")),
        resolve(process.cwd(), "./data/data_simulated.csv"),
    ];

    let csvPath;
    for (const pathCandidate of candidatePaths) {
        try {
            await access(pathCandidate);
            csvPath = pathCandidate;
            break;
        } catch {
            continue;
        }
    }

    if (!csvPath) {
        throw new Error("No se encontró el archivo CSV de migración");
    }

    const csv = await readFile(csvPath, "utf-8");
    const rows = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        for (const row of rows) {
            const values = [
                row.appointment_id,
                row.appointment_date,
                row.patient_name,
                row.patient_email,
                row.patient_phone,
                row.patient_address,
                row.doctor_name,
                row.doctor_email,
                row.specialty,
                row.treatment_code,
                row.treatment_description,
                row.treatment_cost,
                row.insurance_provider,
                row.coverage_percentage,
                row.amount_paid,
            ];

            await client.query(`
                INSERT INTO migration (
                    appointment_id,
                    appointment_date,
                    patient_name,
                    patient_email,
                    patient_phone,
                    patient_address,
                    doctor_name,
                    doctor_email,
                    specialty,
                    treatment_code,
                    treatment_description,
                    treatment_cost,
                    insurance_provider,
                    coverage_percentage,
                    amount_paid
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                ON CONFLICT (appointment_id) DO NOTHING
            `, values);
        }

        await client.query("COMMIT");
        console.log("Datos cargados en tabla migration");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error cargando datos en migration:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function normalizeData() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(`
            INSERT INTO specialties (description)
            SELECT DISTINCT specialty
            FROM migration m
            WHERE m.specialty IS NOT NULL
              AND NOT EXISTS (
                  SELECT 1
                  FROM specialties s
                  WHERE s.description = m.specialty
              )
        `);

        await client.query(`
            INSERT INTO insurances (name, coverage_percentage)
            SELECT DISTINCT insurance_provider, coverage_percentage
            FROM migration
            WHERE insurance_provider IS NOT NULL
            ON CONFLICT (name) DO NOTHING
        `);

        await client.query(`
            INSERT INTO treatments (treatment_code, description, cost)
            SELECT DISTINCT treatment_code, treatment_description, treatment_cost
            FROM migration
            WHERE treatment_code IS NOT NULL
            ON CONFLICT (treatment_code) DO NOTHING
        `);

        await client.query(`
            INSERT INTO patients (name, email, phone, address, insurance_id)
            SELECT DISTINCT
                m.patient_name,
                m.patient_email,
                m.patient_phone,
                m.patient_address,
                i.id_insurance
            FROM migration m
            LEFT JOIN insurances i ON i.name = m.insurance_provider
            WHERE m.patient_email IS NOT NULL
            ON CONFLICT (email) DO NOTHING
        `);

        await client.query(`
            INSERT INTO doctors (name, email, id_specialty)
            SELECT DISTINCT
                m.doctor_name,
                m.doctor_email,
                s.id_specialty
            FROM migration m
            JOIN specialties s ON s.description = m.specialty
            WHERE m.doctor_email IS NOT NULL
            ON CONFLICT (email) DO NOTHING
        `);

        await client.query(`
            INSERT INTO appointments (appointment_date, patient_id, doctor_id, treatment_id)
            SELECT DISTINCT
                m.appointment_date,
                p.id_patient,
                d.id_doctor,
                t.id_treatment
            FROM migration m
            JOIN patients p ON p.email = m.patient_email
            JOIN doctors d ON d.email = m.doctor_email
            JOIN treatments t ON t.treatment_code = m.treatment_code
            WHERE NOT EXISTS (
                SELECT 1
                FROM appointments a
                WHERE a.appointment_date = m.appointment_date
                  AND a.patient_id = p.id_patient
                  AND a.doctor_id = d.id_doctor
                  AND a.treatment_id = t.id_treatment
            )
        `);

        await client.query("COMMIT");
        console.log("Datos normalizados en tablas finales");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error normalizando datos:", error);
        throw error;
    } finally {
        client.release();
    }
}

export async function runMigrations() {
    await loadMigrationData();
    await normalizeData();
}

export const migrationService = runMigrations;
