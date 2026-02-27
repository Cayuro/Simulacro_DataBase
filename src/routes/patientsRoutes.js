import { Router } from "express";
import { getPatientHistoryController } from "../controllers/patientsController.js";

const patientsRouter = Router();

patientsRouter.get("/:email/history", getPatientHistoryController);

export default patientsRouter;
