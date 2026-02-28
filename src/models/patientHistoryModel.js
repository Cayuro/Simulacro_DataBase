import mongoose from 'mongoose';

// ── Schema para una cita médica (subdocumento)
const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true
  },
  date: {
    type: Date,                    // cambio: String → Date (fecha real)
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  doctorEmail: {
    type: String,
    required: true,
    match: /^\S+@\S+\.\S+$/        // validación: debe ser email válido
  },
  specialty: {
    type: String,
    required: true
  },
  treatmentCode: {
    type: String,
    required: true
  },
  treatmentDescription: {
    type: String,
    required: true
  },
  treatmentCost: {
    type: Number,
    required: true,
    min: 0                         // no puede ser negativo
  },
  insuranceProvider: {
    type: String,
    required: true
  },
  coveragePercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100                       // entre 0 y 100%
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });               // sin ID automático (es subdocumento)

// ── Schema del historial del paciente
const patientHistorySchema = new mongoose.Schema({
  patientEmail: {
    type: String,
    required: true,
    unique: true,                 // cada paciente una sola vez
    match: /^\S+@\S+\.\S+$/       // validación: email válido
  },
  patientName: {
    type: String,
    required: true
  },
  appointments: {
    type: [appointmentSchema],    // array de citas
    default: []                   // por defecto vacío
  }
}, { 
  timestamps: true               // createdAt y updatedAt automáticos
});

// ── Crear índice en email para búsquedas rápidas
patientHistorySchema.index({ patientEmail: 1 });

// ── Crear el modelo
export const PatientHistory = mongoose.model('PatientHistory', patientHistorySchema);
