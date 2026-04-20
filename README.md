# 🏥 MediCore - Enterprise Hospital Management System

**MediCore** is a next-generation, full-stack Hospital Management System (HMS) built to revolutionize how medical institutions operate. It provides a seamless, unified platform for administrators, doctors, receptionists, and patients, ensuring that healthcare delivery is efficient, data-driven, and focused on patient outcomes.

---

## 🚩 Problem Statement
In the traditional healthcare landscape, hospitals face significant operational hurdles:
- **Fragmented Data**: Medical records, billing info, and lab reports are often scattered across different systems or physical files.
- **Queue Management**: Poor scheduling leads to long patient wait times and overworked staff.
- **Communication Gaps**: Misalignment between receptionists, doctors, and specialists can delay critical treatments.
- **Security Risks**: Storing sensitive Personal Health Information (PHI) without proper encryption or access control.
- **Manual Billing**: Paper-based or legacy billing systems are prone to errors and lack transparency.

## 💡 The Solution: MediCore
MediCore addresses these challenges by providing a **Unified Digital Operating System** for hospitals. It centralizes all clinical and administrative workflows into a single, high-performance web application, featuring real-time synchronization, AI-powered health assistance, and secure payment processing.

---

## 🛠️ Tech Stack

### Frontend (User Interface)
- **Vite + React.js**: Lightning-fast development and optimized production bundles.
- **Tailwind CSS**: A modern design system for a sleek, responsive, and professional UI.
- **Lucide Icons**: High-quality, consistent iconography across all dashboards.
- **Axios**: Advanced API communication with automated token management for secure sessions.
- **React Context API**: Centralized state management for user authentication and global data.

### Backend (Infrastructure)
- **Node.js & Express**: A robust, event-driven architecture for handling high-concurrency medical records.
- **MongoDB & Mongoose**: A flexible NoSQL database to store complex patient histories and clinical data.
- **Cloudinary API**: Secure, cloud-based storage for clinical images, lab reports, and doctor signatures.
- **Groq AI (Llama 3.3)**: Integrated Large Language Model (LLM) for intelligent clinical analysis and patient assistance.
- **Razorpay**: Integrated payment gateway for seamless, real-time healthcare billing and refunds.

---

## ⚙️ How It Works (Architecture)

MediCore follows a **Role-Based Access Control (RBAC)** architecture:
1. **Authentication**: Users log in via a centralized portal. JWT tokens are issued and stored securely, determining their access level.
2. **Dashboard Routing**: Depending on the role (Admin, Doctor, etc.), the system dynamically renders the appropriate workspace.
3. **Real-time API**: The frontend communicates with specialized backend routes for appointments, billing, and clinical records.
4. **Cloud Integration**: Documents like bills or prescriptions are uploaded to Cloudinary, ensuring they are accessible from anywhere but protected by secure URLs.

---

## 🖥️ The 4 Power Dashboards

### 1. 🛡️ Super Admin Dashboard (The Control Tower)
The brain of the system, designed for hospital owners and high-level administrators.
- **System-wide Analytics**: Real-time charts showing total revenue, patient influx, and department-wise performance.
- **Staff Management**: Create, update, and manage accounts for doctors and receptionists.
- **Clinical Governance**: Monitor doctor performance and department statistics.
- **Data Export**: Export critical hospital data for auditing or reporting.
- **Contact Management**: Handle inquiries and messages from the "Contact Sales" or inquiry forms.

### 2. 👨‍⚕️ Doctor Dashboard (Clinical Hub)
A streamlined workspace for medical professionals to manage their clinical day.
- **Appointment Queue**: A real-time list of assigned patients with status indicators (Checked-In, Completed, etc.).
- **Electronic Health Records (EHR)**: Secure access to patient medical histories, previous diagnoses, and lab results.
- **Digital Prescriptions**: Generate professional PDF-style prescriptions with diagnoses, medicine checklists, and follow-up dates.
- **Availability Control**: Manage consulting hours, mark leaves, and set appointment durations.
- **Dashboard Stats**: Track "Today's Patients," "Total Network," and "Active Scripts."

### 3. 👤 Patient Dashboard (Personal Health Portal)
Empowering patients to take control of their health journey.
- **One-Click Booking**: Find doctors by specialization, check their availability, and book slots instantly.
- **Medical Vault**: Access all personal prescriptions, lab reports, and medical history in one place.
- **Unified Billing**: View, pay, and download receipts for all consultations and hospital services.
- **Health Chatbot**: A Groq-powered AI assistant to answer medical queries, explain symptoms, or provide general wellness advice.
- **Profile Management**: Update allergies, blood group, and emergency contact details for better care.

### 4. ⌨️ Receptionist Dashboard (Operational Hub)
The front-line hub for hospital coordination and logistics.
- **Appointment Lifecycle**: Handle the entire journey of an appointment—from "Pending" to "Confirmed" to "Checked-Out."
- **Queue Coordination**: Track doctor leaves and update availability real-time to prevent scheduling conflicts.
- **Dynamic Billing**: Create instant bills for patients, mark as paid, and upload digital receipts.
- **Report Management**: Upload and assign lab reports to patient profiles for doctor review.
- **Refund Processing**: Automated refund triggers for cancelled appointments via Razorpay integration.

---

## ✨ Standout Features
- **Predictive Queueing**: Minimizes wait times by aligning doctor availability with real-time patient check-ins.
- **Smart Medical Chatbot**: Exclusive healthcare AI that refuses non-medical queries, ensuring a focused assistant for health advice.
- **Clinical Document Management**: No more lost paperwork. Every prescription and lab report is digitized and encrypted.
- **Razorpay Integration**: Supports multiple payment modes (UPI, Cards, Wallets) for medical bills.
- **Department Statistics**: High-level insights into which departments (Cardiology, Orthopedic, etc.) are most active.

---

## 📦 Deployment & Setup

### Vercel Live Links
- **Frontend**: [https://medicore-hmss.vercel.app](https://medicore-hmss.vercel.app)
- **Backend**: [https://medi-core-backend.vercel.app](https://medi-core-backend.vercel.app)

### SuperAdmin Credentials (Demo)
- **Email**: `superadmin@medicore.com`
- **Password**: `adminmedicore`

### Local Installation
1. **Clone the Repo**: `git clone https://github.com/heyaryanmittal/MediCore.git`
2. **Backend Setup**:
   - `cd backend`
   - `npm install`
   - Configure `.env` (MongoDB URI, Cloudinary, Razorpay, Groq API Keys).
   - `npm run dev`
3. **Frontend Setup**:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

---

**Developed with ❤️ by [Aryan Mittal](https://github.com/heyaryanmittal)**
