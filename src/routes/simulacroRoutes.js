import { Router } from "express";
import { runMigrationController } from "../controllers/simulacroController.js";

const simulacroRouter = Router();

simulacroRouter.post("/migrate", runMigrationController);

export default simulacroRouter;
