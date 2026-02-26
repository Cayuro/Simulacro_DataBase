import { getDoctorById, getDoctors, updateDoctorById } from "../services/doctorService.js";
import { HttpError } from "../utils/httpError.js";

function validateDoctorPayload(payload) {
    const errors = [];

    if (!payload || typeof payload !== "object") {
        errors.push("Body is required");
        return errors;
    }

    if (!payload.name || typeof payload.name !== "string") {
        errors.push("name is required and must be a string");
    }

    if (!payload.email || typeof payload.email !== "string" || !payload.email.includes("@")) {
        errors.push("email is required and must be valid");
    }

    if (!payload.specialty || typeof payload.specialty !== "string") {
        errors.push("specialty is required and must be a string");
    }

    return errors;
}

export async function getDoctorsController(req, res, next) {
    try {
        const doctors = await getDoctors();
        res.status(200).json({ success: true, data: doctors });
    } catch (error) {
        next(error);
    }
}

export async function getDoctorByIdController(req, res, next) {
    try {
        const idDoctor = Number(req.params.id);
        if (!Number.isInteger(idDoctor) || idDoctor <= 0) {
            throw new HttpError(400, "id must be a positive integer");
        }

        const doctor = await getDoctorById(idDoctor);
        res.status(200).json({ success: true, data: doctor });
    } catch (error) {
        next(error);
    }
}

export async function updateDoctorController(req, res, next) {
    try {
        const idDoctor = Number(req.params.id);
        if (!Number.isInteger(idDoctor) || idDoctor <= 0) {
            throw new HttpError(400, "id must be a positive integer");
        }

        const validationErrors = validateDoctorPayload(req.body);
        if (validationErrors.length > 0) {
            throw new HttpError(400, "Validation error", validationErrors);
        }

        const updatedDoctor = await updateDoctorById(idDoctor, req.body);
        res.status(200).json({ success: true, data: updatedDoctor });
    } catch (error) {
        next(error);
    }
}
