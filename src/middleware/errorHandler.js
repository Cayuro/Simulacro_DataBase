import { HttpError } from "../utils/httpError.js";

export function notFoundHandler(req, res, next) {
    next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error, req, res, next) {
    let statusCode = error instanceof HttpError ? error.statusCode : 500;
    if (error?.code === "23505") {
        statusCode = 409;
    }

    if (error?.name === "ValidationError") {
        statusCode = 400;
    }

    const payload = {
        success: false,
        message: error.message || "Internal server error"
    };

    if (error instanceof HttpError && error.details) {
        payload.details = error.details;
    }

    if (statusCode >= 500 && process.env.NODE_ENV !== "production") {
        payload.stack = error.stack;
    }

    res.status(statusCode).json(payload);
}
