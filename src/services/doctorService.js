import { pool } from "../config/postgres.js";
import { HttpError } from "../utils/httpError.js";
import { syncDoctorInMongo } from "./patientHistoryService.js";

const DOCTOR_BASE_QUERY = `
SELECT
    d.id_doctor,
    d.name,
    d.email,
    d.id_specialty,
    s.description AS specialty
FROM doctors d
JOIN specialties s ON s.id_specialty = d.id_specialty
`;

export async function getDoctors() {
    const result = await pool.query(`${DOCTOR_BASE_QUERY} ORDER BY d.id_doctor ASC`);
    return result.rows;
}

export async function getDoctorById(idDoctor) {
    const result = await pool.query(`${DOCTOR_BASE_QUERY} WHERE d.id_doctor = $1`, [idDoctor]);

    if (result.rowCount === 0) {
        throw new HttpError(404, "Doctor not found");
    }

    return result.rows[0];
}

export async function updateDoctorById(idDoctor, payload) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const currentDoctorResult = await client.query(`${DOCTOR_BASE_QUERY} WHERE d.id_doctor = $1 FOR UPDATE`, [idDoctor]);
        if (currentDoctorResult.rowCount === 0) {
            throw new HttpError(404, "Doctor not found");
        }

        const oldDoctor = currentDoctorResult.rows[0];

        const specialtyResult = await client.query(
            `INSERT INTO specialties (description)
             VALUES ($1)
             ON CONFLICT (description) DO UPDATE SET description = EXCLUDED.description
             RETURNING id_specialty`,
            [payload.specialty]
        );

        const updatedDoctorResult = await client.query(
            `UPDATE doctors
             SET name = $1,
                 email = $2,
                 id_specialty = $3
             WHERE id_doctor = $4
             RETURNING id_doctor, name, email, id_specialty`,
            [payload.name, payload.email, specialtyResult.rows[0].id_specialty, idDoctor]
        );

        await client.query("COMMIT");

        await syncDoctorInMongo(
            {
                oldEmail: oldDoctor.email,
                oldName: oldDoctor.name
            },
            {
                newEmail: updatedDoctorResult.rows[0].email,
                newName: updatedDoctorResult.rows[0].name,
                newSpecialty: payload.specialty
            }
        );

        return getDoctorById(idDoctor);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
