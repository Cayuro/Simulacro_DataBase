import mongoose from 'mongoose';

// ════════════════════════════════════════════════════════════════
// EJEMPLO: UNIVERSIDAD (para entender el patrón)
// ════════════════════════════════════════════════════════════════

// COMPARACIÓN CON SALUDPLUS:
// PatientHistory → StudentRecord (historial del estudiante)
// Appointment → Enrollment (inscripción en un curso)

// ── Schema para una inscripción (subdocumento)
const enrollmentSchema = new mongoose.Schema({
  enrollmentId: {
    type: String,
    required: true
  },
  courseCode: {                    // antes: appointmentId
    type: String,
    required: true
  },
  courseName: {                    // antes: treatmentDescription
    type: String,
    required: true
  },
  professor: {                     // antes: doctorName
    type: String,
    required: true
  },
  professorEmail: {                // antes: doctorEmail
    type: String,
    required: true,
    match: /^\S+@\S+\.\S+$/
  },
  department: {                    // antes: specialty
    type: String,
    required: true
  },
  enrollmentDate: {                // antes: date
    type: Date,
    required: true
  },
  credits: {                       // antes: treatmentCost (número importante)
    type: Number,
    required: true,
    min: 1,
    max: 6
  },
  finalGrade: {                    // antes: amountPaid (número importante)
    type: Number,
    required: true,
    min: 0,
    max: 5                         // notas de 0 a 5
  },
  approved: {                      // NUEVO: booleano (sí o no aprobó)
    type: Boolean,
    default: false
  }
}, { _id: false });

// ── Schema del historial académico del estudiante
const studentRecordSchema = new mongoose.Schema({
  studentEmail: {                  // antes: patientEmail
    type: String,
    required: true,
    unique: true,
    match: /^\S+@\S+\.\S+$/
  },
  studentName: {                   // antes: patientName
    type: String,
    required: true
  },
  studentId: {                     // NUEVO: ID estudiantil único
    type: String,
    required: true,
    unique: true
  },
  enrollments: {                   // antes: appointments (cambio de nombre!)
    type: [enrollmentSchema],
    default: []
  },
  totalCreditsEarned: {            // NUEVO: campo calculado
    type: Number,
    default: 0
  },
  academicStatus: {                // NUEVO: estado del estudiante
    type: String,
    enum: ['active', 'graduated', 'suspended', 'inactive'],
    default: 'active'
  }
}, { 
  timestamps: true
});

// ── Crear índices
studentRecordSchema.index({ studentEmail: 1 });
studentRecordSchema.index({ studentId: 1 });

// ── Crear el modelo
export const StudentRecord = mongoose.model('StudentRecord', studentRecordSchema);

// ════════════════════════════════════════════════════════════════
// TABLA COMPARATIVA: ¿QUÉ CAMBIA?
// ════════════════════════════════════════════════════════════════
/*
SALUDPLUS (Clínica)          →    UNIVERSIDAD
─────────────────────────────────────────────────────────────────
PatientHistory               →    StudentRecord
patientEmail                 →    studentEmail
patientName                  →    studentName
appointments[]               →    enrollments[]

Subdocumento:
appointmentId                →    enrollmentId
date                         →    enrollmentDate
doctorName                   →    professor
doctorEmail                  →    professorEmail
specialty                    →    department
treatmentCode/Description    →    courseCode/courseName
treatmentCost                →    credits
amountPaid                   →    finalGrade
insuranceProvider            →    (no aplica en universidad)

NUEVOS CAMPOS EN UNIVERSIDAD:
- studentId (ID único del estudiante)
- approved (booleano: aprobó o no)
- academicStatus (enum: active, graduated, etc)
- totalCreditsEarned (suma de créditos)

DIFERENCIAS EN VALIDACIÓN:
- finalGrade: max 5 (en lugar de max 100)
- credits: max 6 (en lugar de max 100)
- approved: booleano (en lugar de porcentaje)
*/
