import express from "express";
import apiRouter from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
	res.status(200).json({ success: true, message: "OK" });
});

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;