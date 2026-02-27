# SaludPlus - Hybrid Persistence Architecture (Performance Drill)

## 1) Project Overview
SaludPlus is a Node.js + Express API implementing a hybrid persistence architecture:
- PostgreSQL for normalized master data and transactional consistency (ACID)
- MongoDB for fast patient history reads using embedded appointments

The project is designed for technical evaluation scenarios focused on architecture quality, consistency strategy, and endpoint implementation.

## 2) Architecture Decisions
### Why SQL (PostgreSQL)
PostgreSQL stores master entities and relationships:
- `patients`, `doctors`, `specialties`, `treatments`, `insurances`, `appointments`
- Strong referential integrity with foreign keys
- Constraints + indexes for consistency and query performance

### Why NoSQL (MongoDB)
MongoDB stores read-optimized patient histories in `patient_histories`:
- One document per patient (`patientEmail` as business key)
- Embedded appointments for low-latency history queries

### Embedding vs Referencing
Embedding is used for appointments inside patient history because read pattern is:
- "Get full patient timeline by email"
This avoids runtime joins and improves endpoint latency for `/api/patients/:email/history`.

## 3) Database Schemas
### PostgreSQL (normalized)
- `specialties(id_specialty, description UNIQUE)`
- `insurances(id_insurance, name UNIQUE, coverage_percentage CHECK)`
- `treatments(id_treatment, treatment_code UNIQUE, description, cost CHECK)`
- `patients(id_patient, email UNIQUE, insurance_id FK)`
- `doctors(id_doctor, email UNIQUE, id_specialty FK)`
- `appointments(id_appointment, appointment_code UNIQUE, appointment_date, patient_id FK, doctor_id FK, treatment_id FK, amount_paid)`
- `migration(...)` staging/audit table

Normalization:
- 1NF: atomic values
- 2NF: non-key attributes fully depend on key
- 3NF: transitive dependencies extracted into dedicated tables (`specialties`, `insurances`, `treatments`)

### MongoDB
Collection: `patient_histories`
- `patientEmail` (unique)
- `patientName`, `patientPhone`, `patientAddress`
- `appointments[]` embedded subdocuments with doctor/treatment/payment snapshot

## 4) API Documentation
Base path: `/api`

### Simulacro
- `POST /api/simulacro/migrate`
  - Optional body: `{ "clearBefore": true|false }`
  - Runs PostgreSQL + Mongo migrations and returns stats

### Doctors
- `GET /api/doctors`
- `GET /api/doctors/:id`
- `PUT /api/doctors/:id`
  - Body: `{ "name": "...", "email": "...", "specialty": "..." }`
  - Propagates doctor updates to embedded Mongo appointments

### Reports
- `GET /api/reports/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD`

### Patients
- `GET /api/patients/:email/history`

### Health
- `GET /health`

## 5) Setup Instructions
1. Start databases:
   - `docker compose up -d`
2. Install dependencies:
   - `npm install`
3. Create `.env` from `.env.example`
4. Run API:
   - `npm run dev`

## 6) Usage Examples
- Trigger migration:
  - `curl -X POST http://localhost:3000/api/simulacro/migrate -H "Content-Type: application/json" -d '{"clearBefore":true}'`
- List doctors:
  - `curl http://localhost:3000/api/doctors`
- Update doctor:
  - `curl -X PUT http://localhost:3000/api/doctors/1 -H "Content-Type: application/json" -d '{"name":"Dr. Jane Doe","email":"jane@saludplus.com","specialty":"Cardiology"}'`
- Revenue report:
  - `curl "http://localhost:3000/api/reports/revenue?from=2024-01-01&to=2024-12-31"`
- Patient history:
  - `curl http://localhost:3000/api/patients/ana.torres@mail.com/history`

## 7) Migration Explanation
Migration is implemented in two coordinated services:
- PostgreSQL migration (`migrationService`): transactional upserts for normalized tables
- Mongo migration (`migrateMongoService`): rebuilds patient histories using `bulkWrite`

Idempotency strategy:
- SQL upserts by business keys (`email`, `treatment_code`, `appointment_code`, etc.)
- Mongo upserts by `patientEmail`
- Optional full reset using `clearBefore=true`

## 8) Index Strategy
PostgreSQL:
- emails, business keys, and query-driving FKs indexed
- composite patient/date index for history/reports

MongoDB:
- unique index on `patientEmail`
- indexes on embedded `appointments.appointmentId` and `appointments.doctorEmail`

## 9) Consistency Strategy SQL ↔ Mongo
Source of truth: PostgreSQL.
Read model: MongoDB patient histories.

Consistency mechanisms:
- Bulk rebuild from CSV migration for initial/full sync
- Targeted propagation for doctor updates (SQL update + Mongo embedded updates)

## 10) Tradeoffs
Pros:
- Fast patient-history reads in Mongo
- Strong transactional consistency in SQL
- Clear separation of write model vs read model

Cons:
- Eventual consistency risks if partial failures occur between SQL and Mongo updates
- Higher operational complexity (two databases)
- Requires explicit sync policies for additional entities beyond doctor updates
