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

/*
CUALQUIER DOMINIO:
┌─────────────────────────────────────────┐
│ [ENTIDAD]Record / [ENTIDAD]History      │
│ - email (unique)      ← SIEMPRE         │
│ - name                ← SIEMPRE         │
│ - [EVENTO]s: Array[]  ← SIEMPRE         │
│                                         │
│ Donde [EVENTO] es:                      │
│ - Appointment (clínica)                 │
│ - Enrollment (universidad)              │
│ - Transaction (banco)                   │
│ - Order (e-commerce)                    │
└─────────────────────────────────────────┘

// PASO 1: Renombra la entidad principal
PatientHistory  →  StudentRecord
patientEmail    →  studentEmail
patientName     →  studentName

// PASO 2: Renombra el subdocumento
Appointment     →  Enrollment
appointmentId   →  enrollmentId
date            →  enrollmentDate

// PASO 3: Adapta los campos al contexto
doctorName      →  professor
doctorEmail     →  professorEmail
specialty       →  department
treatmentCode   →  courseCode
amountPaid      →  finalGrade (porque es una calificación, no un monto)
insuranceProvider → (se elimina, no aplica)

// PASO 4: Agrega campos nuevos si necesitas (validaciones diferentes)
approved: Boolean     // ¿aprobó sí o no?
credits: Number       // créditos (0-6, no 0-100)
academicStatus: enum  // estado específico del estudiante
*/