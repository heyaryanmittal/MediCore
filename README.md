# MediCore — Hospital Management System

> A full-stack, role-based Hospital Management System built to digitize and unify clinical and administrative hospital operations in a single web platform.

**Live Demo**
- Frontend: [https://medicore-hmss.vercel.app](https://medicore-hmss.vercel.app)
- Backend API: [https://medi-core-backend.vercel.app](https://medi-core-backend.vercel.app)

---

## Table of Contents

- [Why MediCore](#why-medicore)
- [Problem Statement](#problem-statement)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Data Models](#data-models)
- [API Routes](#api-routes)
- [User Roles & Access Control](#user-roles--access-control)
- [Features by Role](#features-by-role)
- [Application Flow](#application-flow)
- [Environment Variables](#environment-variables)
- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Demo Credentials](#demo-credentials)
- [License](#license)

---

## Why MediCore

Most hospitals — especially mid-scale ones — run on a fragmented mix of paper records, legacy desktop software, and disconnected tools. Receptionists manage appointments on spreadsheets, doctors write prescriptions on paper, billing is done manually, and lab reports are physically handed over to patients. There is no single source of truth.

MediCore was built to solve this. The goal was to create a production-grade HMS that a real hospital could pick up and deploy — one that handles the entire patient lifecycle from booking to billing inside a single, unified system.

---

## Problem Statement

| Problem | Impact |
|---|---|
| Fragmented medical records across departments | Doctors lack full patient context at consultation time |
| No centralized appointment scheduling | Double-bookings, long wait times, scheduling conflicts |
| Manual billing and paper receipts | Billing errors, no audit trail, no digital payment support |
| Lab reports physically handed to patients | Reports get lost, doctors cannot access them remotely |
| No role-based access to patient data | Data privacy risks; all staff can see everything |
| No patient-facing portal | Patients depend entirely on hospital staff for information |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| React 19 + Vite 7 | UI framework and build tooling |
| React Router DOM v7 | Client-side routing with lazy loading |
| Tailwind CSS v4 | Utility-first styling |
| Lucide React | Icon library |
| Recharts | Analytics charts and data visualizations |
| Axios | HTTP client with centralized API instance |
| React Hook Form | Form state management and validation |
| React Hot Toast | Toast notification system |
| date-fns | Date formatting and manipulation |
| React Context API | Global auth and chatbot state |

### Backend

| Technology | Purpose |
|---|---|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose 9 | Database and ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT-based authentication |
| Cloudinary + Multer | Cloud file storage for documents and images |
| PDFKit | Server-side PDF generation for prescriptions and bills |
| Razorpay | Payment gateway (orders, capture, refunds) |
| Nodemailer | Transactional email (booking confirmation, password reset) |
| OpenRouter AI (Nemotron Ultra) | LLM powering the medical chatbot |
| Helmet | HTTP security headers |
| express-rate-limit | API rate limiting |
| express-validator | Request validation |
| Morgan | HTTP request logging |

### Infrastructure

| Service | Purpose |
|---|---|
| Vercel | Deployment for both frontend and backend |
| MongoDB Atlas | Managed cloud database |
| Cloudinary | File and image CDN |

---

## Architecture

```
+-----------------------------------------------------+
|                    CLIENT (React)                    |
|  AuthContext -> Axios Instance -> React Router DOM   |
+--------------------+--------------------------------+
                     | HTTPS REST
+--------------------v--------------------------------+
|                Express 5 Server                      |
|                                                      |
|  Helmet -> CORS -> Rate Limiter -> Morgan            |
|       v                                              |
|  authenticateToken (JWT Middleware)                  |
|       v                                              |
|  authorizeRoles (RBAC Middleware)                    |
|       v                                              |
|  Route Handlers -> Controllers -> Mongoose Models    |
|                                                      |
|  Side integrations:                                  |
|  +-- Cloudinary (file uploads via Multer)            |
|  +-- Razorpay (payment orders & webhooks)            |
|  +-- Nodemailer (transactional email)                |
|  +-- PDFKit (prescription & bill PDF generation)     |
|  +-- OpenRouter AI (chatbot LLM inference)           |
+--------------------+--------------------------------+
                     | Mongoose ODM
+--------------------v--------------------------------+
|                MongoDB Atlas                         |
|  Collections: User, Doctor, Patient, Appointment,   |
|  Bill, Prescription, LabReport, ContactMessage       |
+-----------------------------------------------------+
```

### Authentication Flow

1. User submits credentials → `POST /api/auth/login`
2. Server verifies password with `bcryptjs`, issues a signed JWT
3. Token stored client-side (AuthContext), attached to all requests via Axios interceptors
4. `authenticateToken` middleware decodes the token and attaches `req.user`
5. `authorizeRoles` middleware checks `req.user.role` against the allowed roles for that route
6. Password reset uses a 6-digit OTP emailed via Nodemailer, expiring in 1 hour

### Payment Flow

1. Patient selects a doctor and time slot → client calls `POST /api/payments/create-order`
2. Backend creates a Razorpay order and returns `orderId` + `amount`
3. Razorpay checkout renders on the client
4. On success, client calls `POST /api/payments/verify` with signature data
5. Backend verifies the HMAC signature and marks the appointment as `paid`
6. Booking confirmation email sent to patient via Nodemailer

### Document Flow

1. Receptionist uploads a lab report (PDF/image) → `POST /api/documents/lab-report`
2. Multer streams file to Cloudinary via `multer-storage-cloudinary`
3. Cloudinary returns a secure URL stored in the `LabReport` document
4. Doctor generates a prescription → PDFKit renders PDF in-memory → uploaded to Cloudinary
5. Patient accesses all documents from their dashboard via the stored Cloudinary URLs

---

## Project Structure

```
MediCore/
+-- backend/
|   +-- config/
|   |   +-- cloudinary.js           # Cloudinary SDK init
|   +-- controllers/
|   |   +-- superadminController.js # Admin-level business logic
|   +-- middleware/
|   |   +-- auth.js                 # JWT auth + RBAC middleware
|   +-- models/
|   |   +-- User.js
|   |   +-- Doctor.js
|   |   +-- Patient.js
|   |   +-- Appointment.js
|   |   +-- Bill.js
|   |   +-- Prescription.js
|   |   +-- LabReport.js
|   |   +-- ContactMessage.js
|   +-- routes/
|   |   +-- auth.js
|   |   +-- admin.js
|   |   +-- doctor.js
|   |   +-- receptionist.js
|   |   +-- patient.js
|   |   +-- appointments.js
|   |   +-- payments.js
|   |   +-- chatbot.js
|   |   +-- documents.js
|   |   +-- contact.js
|   +-- utils/
|   |   +-- emailService.js         # Nodemailer transporter + email templates
|   |   +-- jwtUtils.js             # JWT sign/verify helpers
|   |   +-- razorpay.js             # Razorpay instance init
|   +-- server.js                   # Express app, DB connection, route mounting
|   +-- vercel.json                 # Vercel serverless config
|   +-- package.json
|
+-- frontend/
    +-- src/
    |   +-- components/
    |   |   +-- BillUploadModal.jsx
    |   |   +-- Chatbot.jsx
    |   |   +-- ConfirmDialog.jsx
    |   |   +-- LabReportUploadModal.jsx
    |   |   +-- LoadingSpinner.jsx
    |   |   +-- PrescriptionModal.jsx
    |   |   +-- ProtectedRoute.jsx
    |   +-- context/
    |   |   +-- AuthContext.jsx      # Auth state + login/logout
    |   |   +-- ChatbotContext.jsx   # Chatbot open/close state
    |   +-- hooks/
    |   |   +-- visit_log.js        # Visitor analytics logger
    |   +-- layouts/
    |   |   +-- Layout.jsx          # Shared layout for protected routes
    |   +-- pages/
    |   |   +-- auth/
    |   |   |   +-- Login.jsx
    |   |   |   +-- Register.jsx
    |   |   |   +-- ForgotPassword.jsx
    |   |   +-- dashboard/
    |   |   |   +-- SuperAdminDashboard.jsx
    |   |   |   +-- DoctorDashboard.jsx
    |   |   |   +-- ReceptionistDashboard.jsx
    |   |   |   +-- PatientDashboard.jsx
    |   |   |   +-- CreateStaff.jsx
    |   |   |   +-- StaffManagement.jsx
    |   |   |   +-- DoctorsManagement.jsx
    |   |   |   +-- PatientManagement.jsx
    |   |   |   +-- DoctorAvailability.jsx
    |   |   |   +-- DetailedAnalytics.jsx
    |   |   |   +-- ContactMessages.jsx
    |   |   +-- Landing.jsx
    |   |   +-- ContactSales.jsx
    |   |   +-- Doctors.jsx
    |   |   +-- BookAppointment.jsx
    |   |   +-- Appointments.jsx
    |   |   +-- Bills.jsx
    |   |   +-- Prescriptions.jsx
    |   |   +-- LabReports.jsx
    |   |   +-- Profile.jsx
    |   |   +-- PaymentSuccess.jsx
    |   +-- services/
    |   |   +-- api.js              # Axios instance with base URL + interceptors
    |   +-- App.jsx                 # Root component, all route definitions
    |   +-- index.jsx               # React DOM entry point
    +-- index.html
    +-- vite.config.js
    +-- tailwind.config.js
    +-- package.json
```

---

## Data Models

### User
Central auth model shared across all roles.

| Field | Type | Notes |
|---|---|---|
| email | String | Unique, lowercase |
| password | String | bcrypt-hashed, min 6 chars |
| role | String | `superadmin`, `doctor`, `receptionist`, `patient` |
| profile | Object | firstName, lastName, phone, address, DOB, gender, avatar |
| isActive | Boolean | Soft disable accounts |
| refreshToken | String | For future token refresh flow |
| resetPasswordToken / Expires | String / Date | OTP-based password reset |

Passwords are hashed via a `pre('save')` hook. Sensitive fields (`password`, `refreshToken`) are stripped from all JSON responses via `toJSON()`.

### Doctor
Extended profile linked to User via `userId`.

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Ref: User |
| specialization | String | |
| qualifications | String | |
| experience | Number | Years |
| licenseNumber | String | Unique |
| consultationFee | Number | In INR |
| availability | Object | `days[]` + `timeSlots[]` (start/end strings) |
| isAvailable | Boolean | Availability toggle |
| rating | Object | average, count |
| department | String | |
| leaves | [String] | Array of `YYYY-MM-DD` strings |

### Patient
Extended profile linked to User via `userId`.

| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | Ref: User |
| medicalRecordNumber | String | Auto-generated `MRN-XXXXXX` |
| medicalHistory | Array | condition, diagnosis, treatment, doctor, date, notes |
| allergies | [String] | |
| medications | Array | name, dosage, frequency, prescribedBy, startDate, endDate |
| emergencyContact | Object | name, relationship, phone |
| bloodGroup | String | Enum: A+, A-, B+, B-, AB+, AB-, O+, O- |
| insuranceInfo | Object | provider, policyNumber, validUntil |

MRN is auto-generated in a `pre('save')` hook with collision checking.

### Appointment

| Field | Type | Notes |
|---|---|---|
| patientId | ObjectId | Ref: Patient |
| doctorId | ObjectId | Ref: Doctor |
| date | Date | |
| timeSlot | Object | start, end (HH:MM strings) |
| status | String | `pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `completed` |
| paymentStatus | String | `pending`, `paid`, `refunded` |
| paymentDetails | Object | orderId, paymentId, amount, currency |
| consultationType | String | `in-person`, `video` |
| symptoms | String | |
| patientDocuments | Array | name, url, documentType |
| prescription | ObjectId | Ref: Prescription |
| cancellationReason | String | |
| cancelledBy | ObjectId | Ref: User |

### Bill

| Field | Type | Notes |
|---|---|---|
| patientId | ObjectId | Ref: Patient |
| appointmentId | ObjectId | Ref: Appointment |
| items | Array | description, quantity, unitPrice, total |
| subtotal / tax / total | Number | |
| status | String | `draft`, `sent`, `paid`, `overdue`, `pending_payment`, `refunded` |
| paymentMethod | String | `cash`, `card`, `online`, `insurance` |
| paymentDetails | Object | orderId, paymentId, amount, currency |
| receipt | String | Cloudinary file URL |
| createdBy | ObjectId | Ref: User |

### Prescription

| Field | Type | Notes |
|---|---|---|
| appointmentId | ObjectId | Ref: Appointment |
| patientId | ObjectId | Ref: Patient |
| doctorId | ObjectId | Ref: Doctor |
| diagnosis | String | |
| medicines | Array | name, dosage, frequency, duration, instructions |
| tests | Array | name, instructions |
| advice | String | |
| followUpDate | Date | |
| receipt | String | PDF URL on Cloudinary |

### LabReport

| Field | Type | Notes |
|---|---|---|
| patientId | ObjectId | Ref: Patient |
| testName / testType | String | |
| reportDate | Date | |
| doctorId | ObjectId | Ref: Doctor |
| results | Array | parameter, value, normalRange, unit, status |
| conclusion / recommendations | String | |
| reportFile | String | Cloudinary file URL |
| uploadedBy | ObjectId | Ref: User |

---

## API Routes

All routes are prefixed with `/api`.

| Prefix | Description |
|---|---|
| `/api/auth` | Login, register, forgot/reset password, logout, token refresh |
| `/api/admin` | Staff creation, system analytics, doctor/staff/patient management |
| `/api/doctor` | Doctor profile, availability, appointments, prescriptions |
| `/api/receptionist` | Appointment management, billing, lab report upload, availability control |
| `/api/patient` | Patient profile, medical history, appointment booking |
| `/api/appointments` | CRUD for appointments, status transitions |
| `/api/payments` | Razorpay order creation, payment verification, refund processing |
| `/api/chatbot` | LLM chat proxy to OpenRouter (medical-context only) |
| `/api/documents` | Prescription PDF upload/download, lab report management |
| `/api/contact` | Contact form submissions, admin inbox |

**Health Check:** `GET /api/health` — Returns server status and database connection state.

---

## User Roles & Access Control

Access is enforced via two Express middleware layers: `authenticateToken` (verifies JWT) and `authorizeRoles` (checks `req.user.role`).

| Role | Access Scope |
|---|---|
| `superadmin` | Full system access: staff management, analytics, all patient data, contact messages |
| `doctor` | Own appointments, own patients, write prescriptions, manage availability |
| `receptionist` | Appointment lifecycle, billing, lab report upload, doctor availability monitoring |
| `patient` | Own profile, own appointments, own bills, own prescriptions and lab reports |

Predefined middleware guards: `superAdminOnly`, `doctorOnly`, `receptionistOnly`, `patientOnly`, `staffOnly` (doctor + receptionist), `allStaff` (superadmin + doctor + receptionist), `superAdminOrReceptionist`.

---

## Features by Role

### Super Admin
- System-wide analytics dashboard with revenue, patient count, and department performance charts (Recharts)
- Create and manage doctor and receptionist accounts
- View and manage all registered patients
- Manage doctor profiles, departments, and license details
- View detailed analytics with date-range filters
- Read and manage contact/inquiry messages submitted via the public form

### Doctor
- Personal dashboard with today''s appointments, total patient count, and active prescriptions
- View assigned appointment queue with real-time status indicators
- Access patient medical history, previous prescriptions, and lab reports
- Generate structured digital prescriptions (diagnosis, medicines, dosage, frequency, follow-up date)
- PDFKit generates a prescription PDF uploaded to Cloudinary
- Manage availability: consulting days, time slots, and leave dates

### Patient
- Self-registration and profile management (blood group, allergies, emergency contact, insurance)
- Browse doctors by specialization and department
- Book appointments with Razorpay payment (UPI, cards, wallets)
- Payment confirmation email delivered via Nodemailer
- View all personal appointments, bills, prescriptions, and lab reports
- Access and download documents (PDF prescriptions, lab report files) from Cloudinary
- AI Health Chatbot powered by OpenRouter (Nemotron Ultra) — restricted to medical queries

### Receptionist
- Manage the full appointment lifecycle: pending → confirmed → checked-in → checked-out
- Monitor and update doctor availability; coordinate leaves
- Create itemized bills for patients (line items, subtotal, tax, total)
- Mark bills as paid and upload payment receipts to Cloudinary
- Upload lab reports and assign them to patient profiles
- Process Razorpay refunds for cancelled appointments

---

## Application Flow

```
User visits /
    +-- Explores public pages: Landing, Doctors, Contact Sales
    +-- Goes to /login or /register
            |
            v
    Authenticated -> JWT stored in AuthContext
            |
            v
    Role-based redirect:
    +-- superadmin   -> /dashboard
    +-- doctor       -> /doctor/dashboard
    +-- receptionist -> /receptionist/dashboard
    +-- patient      -> /patient/dashboard
            |
            v
    All protected routes wrapped in <ProtectedRoute roles={[...]} />
    Unauthorized roles are redirected away

Patient booking flow:
    /patient/book-appointment
    -> Browse doctors -> Select time slot
    -> Razorpay checkout -> POST /api/payments/create-order
    -> Payment -> POST /api/payments/verify
    -> Appointment created, email sent
    -> /patient/payment-success

Prescription flow:
    Doctor views appointment -> Opens PrescriptionModal
    -> Fills diagnosis, medicines, tests, follow-up date
    -> POST /api/documents/prescription
    -> PDFKit generates PDF -> Cloudinary upload -> URL stored in Prescription model
    -> Patient sees prescription in /patient/prescriptions
```

---

## Environment Variables

### Backend (`backend/.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/medicore

# JWT
JWT_SECRET=your_jwt_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

# OpenRouter AI
OPENROUTER_API_KEY=your_openrouter_key

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

---

## Local Setup

**Prerequisites:** Node.js 18/20/22, npm 9/10, MongoDB (local or Atlas)

```bash
# 1. Clone the repository
git clone https://github.com/heyaryanmittal/MediCore.git
cd MediCore

# 2. Backend setup
cd backend
npm install
# Create and fill backend/.env (see above)
npm run dev
# Backend runs on http://localhost:5000

# 3. Frontend setup (new terminal)
cd ../frontend
npm install
# Create and fill frontend/.env (see above)
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Deployment

Both services are deployed serverlessly on Vercel.

**Backend** uses `vercel.json` to route all incoming requests to `server.js` via `@vercel/node`. The server detects the `VERCEL` environment variable and skips `app.listen()`, instead exporting the Express app as a serverless handler.

**Frontend** uses `vite build` to produce a static bundle deployed to Vercel''s CDN. `vercel.json` rewrites all paths to `index.html` for SPA client-side routing.

---

## Demo Credentials

The following credentials are for the live demo only.

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@medicore.com` | `adminmedicore` |

Doctors and receptionists are created by the Super Admin from within the system. Patients can self-register at `/register`.

---

## License

MIT

---

Developed by [Aryan Mittal](https://github.com/heyaryanmittal)
