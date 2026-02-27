import { Router } from "express";
import {
    getDoctorByIdController,
    getDoctorsController,
    updateDoctorController
} from "../controllers/doctorsController.js";

const doctorsRouter = Router();

doctorsRouter.get("/", getDoctorsController);
doctorsRouter.get("/:id", getDoctorByIdController);
doctorsRouter.put("/:id", updateDoctorController);

export default doctorsRouter;
