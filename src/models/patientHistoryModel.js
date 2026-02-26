import { mongoose } from "../config/mongoDB.js";

const embeddedAppointmentSchema = new mongoose.Schema(
    {
        appointmentId: { type: String, required: true },
        appointmentDate: { type: Date, required: true },
        doctorName: { type: String, required: true },
        doctorEmail: { type: String, required: true },
        specialty: { type: String, required: true },
        treatmentCode: { type: String, required: true },
        treatmentDescription: { type: String, required: true },
        treatmentCost: { type: Number, required: true },
        insuranceProvider: { type: String, required: true },
        coveragePercentage: { type: Number, required: true },
        amountPaid: { type: Number, required: true }
    },
    { _id: false }
);

const patientHistorySchema = new mongoose.Schema(
    {
        patientEmail: { type: String, required: true, unique: true, index: true },
        patientName: { type: String, required: true },
        patientPhone: { type: String, required: true },
        patientAddress: { type: String, required: true },
        appointments: { type: [embeddedAppointmentSchema], default: [] }
    },
    {
        timestamps: true,
        versionKey: false,
        collection: "patient_histories"
    }
);

patientHistorySchema.index({ "appointments.appointmentId": 1 });
patientHistorySchema.index({ "appointments.doctorEmail": 1 });

export const PatientHistory =
    mongoose.models.PatientHistory ||
    mongoose.model("PatientHistory", patientHistorySchema);
