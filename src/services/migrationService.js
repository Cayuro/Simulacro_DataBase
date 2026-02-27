import { readFile } from "fs/promises";
import { resolve } from "path";
import { parse } from "csv-parse/sync";
import { pool } from "../config/postgres.js";
import { env } from "../config/env.js";

export async function migrate(clearBefore = false) {
    const client = await pool.connect();

    try {
        const csvPath = resolve(env.fileDataCsv);
        const fileContent = await readFile(csvPath, "utf-8");
        const rows = parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const stats = {
            rowsRead: rows.length,
            migrationUpserts: 0,
            specialtiesUpserts: 0,
            insurancesUpserts: 0,
            treatmentsUpserts: 0,
            patientsUpserts: 0,
            doctorsUpserts: 0,
            appointmentsUpserts: 0
        };

        await client.query("BEGIN");

        if (clearBefore) {
            await client.query(`
                TRUNCATE TABLE
                    appointments,
                    doctors,
                    patients,
                    treatments,
                    insurances,
                    specialties,
                    migration
                RESTART IDENTITY CASCADE
            `);
        }

        for (const row of rows) {
            await client.query(
                `INSERT INTO migration (
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
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
                )
                ON CONFLICT (appointment_id)
                DO UPDATE SET
                    appointment_date = EXCLUDED.appointment_date,
                    patient_name = EXCLUDED.patient_name,
                    patient_email = EXCLUDED.patient_email,
                    patient_phone = EXCLUDED.patient_phone,
                    patient_address = EXCLUDED.patient_address,
                    doctor_name = EXCLUDED.doctor_name,
                    doctor_email = EXCLUDED.doctor_email,
                    specialty = EXCLUDED.specialty,
                    treatment_code = EXCLUDED.treatment_code,
                    treatment_description = EXCLUDED.treatment_description,
                    treatment_cost = EXCLUDED.treatment_cost,
                    insurance_provider = EXCLUDED.insurance_provider,
                    coverage_percentage = EXCLUDED.coverage_percentage,
                    amount_paid = EXCLUDED.amount_paid`,
                [
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
                    row.amount_paid
                ]
            );
            stats.migrationUpserts += 1;

            await client.query(
                `INSERT INTO specialties (description)
                 VALUES ($1)
                 ON CONFLICT (description)
                 DO UPDATE SET description = EXCLUDED.description`,
                [row.specialty]
            );
            stats.specialtiesUpserts += 1;

            await client.query(
                `INSERT INTO insurances (name, coverage_percentage)
                 VALUES ($1, $2)
                 ON CONFLICT (name)
                 DO UPDATE SET coverage_percentage = EXCLUDED.coverage_percentage`,
                [row.insurance_provider, row.coverage_percentage]
            );
            stats.insurancesUpserts += 1;

            await client.query(
                `INSERT INTO treatments (treatment_code, description, cost)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (treatment_code)
                 DO UPDATE SET
                    description = EXCLUDED.description,
                    cost = EXCLUDED.cost`,
                [row.treatment_code, row.treatment_description, row.treatment_cost]
            );
            stats.treatmentsUpserts += 1;

            await client.query(
                `INSERT INTO patients (name, email, phone, address, insurance_id)
                 VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    (SELECT id_insurance FROM insurances WHERE name = $5)
                 )
                 ON CONFLICT (email)
                 DO UPDATE SET
                    name = EXCLUDED.name,
                    phone = EXCLUDED.phone,
                    address = EXCLUDED.address,
                    insurance_id = EXCLUDED.insurance_id`,
                [
                    row.patient_name,
                    row.patient_email,
                    row.patient_phone,
                    row.patient_address,
                    row.insurance_provider
                ]
            );
            stats.patientsUpserts += 1;

            await client.query(
                `INSERT INTO doctors (name, email, id_specialty)
                 VALUES (
                    $1,
                    $2,
                    (SELECT id_specialty FROM specialties WHERE description = $3)
                 )
                 ON CONFLICT (email)
                 DO UPDATE SET
                    name = EXCLUDED.name,
                    id_specialty = EXCLUDED.id_specialty`,
                [row.doctor_name, row.doctor_email, row.specialty]
            );
            stats.doctorsUpserts += 1;

            await client.query(
                `INSERT INTO appointments (
                    appointment_code,
                    appointment_date,
                    patient_id,
                    doctor_id,
                    treatment_id,
                    amount_paid
                )
                VALUES (
                    $1,
                    $2,
                    (SELECT id_patient FROM patients WHERE email = $3),
                    (SELECT id_doctor FROM doctors WHERE email = $4),
                    (SELECT id_treatment FROM treatments WHERE treatment_code = $5),
                    $6
                )
                ON CONFLICT (appointment_code)
                DO UPDATE SET
                    appointment_date = EXCLUDED.appointment_date,
                    patient_id = EXCLUDED.patient_id,
                    doctor_id = EXCLUDED.doctor_id,
                    treatment_id = EXCLUDED.treatment_id,
                    amount_paid = EXCLUDED.amount_paid`,
                [
                    row.appointment_id,
                    row.appointment_date,
                    row.patient_email,
                    row.doctor_email,
                    row.treatment_code,
                    row.amount_paid
                ]
            );
            stats.appointmentsUpserts += 1;
        }

        await client.query("COMMIT");
        return stats;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export const runMigrations = migrate;
export const migrationService = migrate;
