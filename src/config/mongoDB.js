import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongoDB() {
    if (mongoose.connection.readyState !== 0) {
        return mongoose.connection;
    }

    await mongoose.connect(env.mongoUri);
    return mongoose.connection;
}

export { mongoose };
