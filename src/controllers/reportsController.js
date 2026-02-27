import { getRevenueReport } from "../services/reportService.js";
import { HttpError } from "../utils/httpError.js";

function isValidISODate(value) {
    if (!value) return true;
    return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function getRevenueReportController(req, res, next) {
    try {
        const { from, to } = req.query;

        if (!isValidISODate(from) || !isValidISODate(to)) {
            throw new HttpError(400, "Query params from/to must have YYYY-MM-DD format");
        }

        const report = await getRevenueReport({ from, to });

        res.status(200).json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
}
