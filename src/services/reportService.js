import { pool } from "../config/postgres.js";

export async function getRevenueReport({ from, to }) {
    const values = [];
    const whereParts = [];

    if (from) {
        values.push(from);
        whereParts.push(`a.appointment_date::date >= $${values.length}`);
    }

    if (to) {
        values.push(to);
        whereParts.push(`a.appointment_date::date <= $${values.length}`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(" AND ")}` : "";

    const result = await pool.query(
        `SELECT
            COUNT(*)::int AS appointments_count,
            COALESCE(SUM(t.cost), 0)::numeric(12,2) AS gross_revenue,
            COALESCE(SUM(a.amount_paid), 0)::numeric(12,2) AS net_paid,
            COALESCE(SUM(t.cost - a.amount_paid), 0)::numeric(12,2) AS covered_amount
         FROM appointments a
         JOIN treatments t ON t.id_treatment = a.treatment_id
         ${whereClause}`,
        values
    );

    return result.rows[0];
}
