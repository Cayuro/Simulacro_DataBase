import { Router } from "express";
import simulacroRouter from "./simulacroRoutes.js";
import doctorsRouter from "./doctorsRoutes.js";
import reportsRouter from "./reportsRoutes.js";
import patientsRouter from "./patientsRoutes.js";

const apiRouter = Router();

apiRouter.use("/simulacro", simulacroRouter);
apiRouter.use("/doctors", doctorsRouter);
apiRouter.use("/reports", reportsRouter);
apiRouter.use("/patients", patientsRouter);

export default apiRouter;
