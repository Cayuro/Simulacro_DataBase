import { getPatientHistoryByEmail } from "../services/patientHistoryService.js";
import { HttpError } from "../utils/httpError.js";

function isValidEmail(email) {
    return typeof email === "string" && email.includes("@") && email.includes(".");
}

export async function getPatientHistoryController(req, res, next) {
    try {
        const email = req.params.email;

        if (!isValidEmail(email)) {
            throw new HttpError(400, "Invalid email format");
        }

        const history = await getPatientHistoryByEmail(email);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        next(error);
    }
}
