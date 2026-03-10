/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         MediCore — Full Integration Test Suite                  ║
 * ║  Tests every feature for every role against medicore database   ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * Run: node tests/full-integration.test.js
 *
 * Roles tested: superadmin | receptionist | doctor | patient
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const http = require('http');
const https = require('https');

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE = 'http://localhost:5000/api';
const CREDS = {
    superadmin: { email: 'admin@medicore.com', password: 'Admin@1234' },
    receptionist: { email: 'receptionist@medicore.com', password: 'Recep@1234' },
    doctor: { email: 'doctor.rajesh@medicore.com', password: 'Doctor@1234' },
    doctor2: { email: 'doctor.anita@medicore.com', password: 'Doctor@1234' },
    patient: { email: 'patient.aryan@medicore.com', password: 'Patient@1234' },
    patient2: { email: 'patient.meera@medicore.com', password: 'Patient@1234' },
};

// ─── Test state tracking ─────────────────────────────────────────────────────
const results = [];
const tokens = {};
const ids = {};
let pass = 0, fail = 0;

// ─── HTTP helper ──────────────────────────────────────────────────────────────
const request = (method, path, body, token) => new Promise((resolve) => {
    const url = new URL(BASE + path);
    const payload = body ? JSON.stringify(body) : null;
    const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: 'Bearer ' + token }),
            ...(payload && { 'Content-Length': Buffer.byteLength(payload) })
        }
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(options, res => {
        let raw = '';
        res.on('data', c => raw += c);
        res.on('end', () => {
            let data;
            try { data = JSON.parse(raw); } catch { data = raw; }
            resolve({ status: res.statusCode, data });
        });
    });
    req.on('error', e => resolve({ status: 'ERR', data: e.message }));
    if (payload) req.write(payload);
    req.end();
});

// ─── Test runner helpers ──────────────────────────────────────────────────────
const test = async (group, name, fn) => {
    try {
        const result = await fn();
        if (result.ok) {
            pass++;
            results.push({ group, name, status: 'PASS', detail: result.detail || '' });
        } else {
            fail++;
            results.push({ group, name, status: 'FAIL', detail: result.detail || '' });
        }
    } catch (e) {
        fail++;
        results.push({ group, name, status: 'ERROR', detail: e.message });
    }
};

const expect = (res, statusCode, successVal = true) => {
    const ok = res.status === statusCode && res.data?.success === successVal;
    return {
        ok,
        detail: ok
            ? 'HTTP ' + res.status
            : 'Expected HTTP ' + statusCode + ' success=' + successVal + ', got HTTP ' + res.status + ' success=' + res.data?.success + ' — "' + (res.data?.message || String(res.data)).substring(0, 80) + '"'
    };
};

const expectDenied = (res) => {
    const ok = [401, 403].includes(res.status);
    return { ok, detail: ok ? 'Correctly denied HTTP ' + res.status : 'Expected 401/403, got ' + res.status };
};

// ─── MAIN TEST SUITE ──────────────────────────────────────────────────────────
(async () => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║      MediCore — Full Integration Test Suite                 ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    // ═══════════════════════════════════════════════════════════════
    // SECTION 1: AUTH — Login all roles
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [1] AUTH ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (const [role, creds] of Object.entries(CREDS)) {
        await test('AUTH', 'Login as ' + role, async () => {
            const r = await request('POST', '/auth/login', creds);
            if (r.status === 200 && r.data?.success) {
                tokens[role] = r.data.data.tokens.accessToken;
                ids[role + 'UserId'] = r.data.data.user._id;
                return { ok: true, detail: 'Token acquired for ' + creds.email };
            }
            return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
        });
    }

    await test('AUTH', 'GET /auth/me (patient)', async () => {
        const r = await request('GET', '/auth/me', null, tokens.patient);
        return expect(r, 200);
    });

    await test('AUTH', 'GET /auth/me (doctor)', async () => {
        const r = await request('GET', '/auth/me', null, tokens.doctor);
        return expect(r, 200);
    });

    await test('AUTH', 'Reject unauthenticated /auth/me', async () => {
        const r = await request('GET', '/auth/me', null, null);
        return expectDenied(r);
    });

    await test('AUTH', 'Reject wrong password', async () => {
        const r = await request('POST', '/auth/login', { email: CREDS.patient.email, password: 'WrongPassword!' });
        return expect(r, 401, false);
    });

    await test('AUTH', 'POST /auth/refresh (get new access token)', async () => {
        const loginR = await request('POST', '/auth/login', CREDS.patient);
        const refreshToken = loginR.data?.data?.tokens?.refreshToken;
        if (!refreshToken) return { ok: false, detail: 'No refresh token in login response' };
        const r = await request('POST', '/auth/refresh', { refreshToken });
        return expect(r, 200);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 2: SUPERADMIN Features
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [2] SUPERADMIN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('SUPERADMIN', 'GET /admin/analytics', async () => {
        const r = await request('GET', '/admin/analytics', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/system-overview', async () => {
        const r = await request('GET', '/admin/system-overview', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/user-analytics', async () => {
        const r = await request('GET', '/admin/user-analytics', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/department-stats', async () => {
        const r = await request('GET', '/admin/department-stats', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/staff', async () => {
        const r = await request('GET', '/admin/staff', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/doctors', async () => {
        const r = await request('GET', '/admin/doctors', null, tokens.superadmin);
        if (r.status === 200 && r.data?.success) {
            ids.doctorProfileId = r.data.data.doctors[0]?._id;
            ids.doctorProfileId2 = r.data.data.doctors[1]?._id;
            return { ok: true, detail: 'Found ' + r.data.data.doctors.length + ' doctors' };
        }
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'GET /admin/patients', async () => {
        const r = await request('GET', '/admin/patients', null, tokens.superadmin);
        if (r.status === 200 && r.data?.success) {
            ids.patientProfileId = r.data.data.patients[0]?._id;
            ids.patientProfileId2 = r.data.data.patients[1]?._id;
            return { ok: true, detail: 'Found ' + r.data.data.patients.length + ' patients' };
        }
        return expect(r, 200);
    });

    const newStaffEmail = 'test.staff.' + Date.now() + '@medicore.com';
    await test('SUPERADMIN', 'POST /admin/create-staff (receptionist)', async () => {
        const r = await request('POST', '/admin/create-staff', {
            email: newStaffEmail,
            password: 'Staff@1234',
            firstName: 'Test',
            lastName: 'Staff',
            role: 'receptionist',
            phone: '9000099999',
        }, tokens.superadmin);
        if (r.status === 201 && r.data?.success) {
            ids.newStaffUserId = r.data.data.user._id;
        }
        return expect(r, 201);
    });

    const newDoctorEmail = 'test.doctor.' + Date.now() + '@medicore.com';
    await test('SUPERADMIN', 'POST /admin/create-staff (doctor with clinical fields)', async () => {
        const r = await request('POST', '/admin/create-staff', {
            email: newDoctorEmail,
            password: 'Doctor@1234',
            firstName: 'Test',
            lastName: 'Doctor',
            role: 'doctor',
            phone: '9000088888',
            specialization: 'Dermatology',
            qualifications: 'MBBS, MD (Dermatology)',
            experience: 5,
            licenseNumber: 'TEST-LIC-' + Date.now(),
            consultationFee: 600,
            department: 'Dermatology',
        }, tokens.superadmin);
        if (r.status === 201 && r.data?.success) {
            ids.newDoctorUserId = r.data.data.user._id;
        }
        return expect(r, 201);
    });

    await test('SUPERADMIN', 'Reject create-staff with non-@medicore.com email', async () => {
        const r = await request('POST', '/admin/create-staff', {
            email: 'doctor@gmail.com',
            password: 'Test@1234',
            firstName: 'Bad', lastName: 'Doctor',
            role: 'receptionist',
        }, tokens.superadmin);
        return expect(r, 400, false);
    });

    await test('SUPERADMIN', 'PATCH /admin/user/:id/status (deactivate)', async () => {
        if (!ids.newStaffUserId) return { ok: false, detail: 'No staff userId to deactivate' };
        const r = await request('PATCH', '/admin/user/' + ids.newStaffUserId + '/status', { isActive: false }, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'PATCH /admin/user/:id/status (re-activate)', async () => {
        if (!ids.newStaffUserId) return { ok: false, detail: 'No staff userId' };
        const r = await request('PATCH', '/admin/user/' + ids.newStaffUserId + '/status', { isActive: true }, tokens.superadmin);
        return expect(r, 200);
    });

    await test('SUPERADMIN', 'Prevent deactivating super admin account', async () => {
        const r = await request('PATCH', '/admin/user/' + ids.superadminUserId + '/status', { isActive: false }, tokens.superadmin);
        return expect(r, 400, false);
    });

    await test('SUPERADMIN', 'Deny patient access to /admin/staff', async () => {
        const r = await request('GET', '/admin/staff', null, tokens.patient);
        return expectDenied(r);
    });

    await test('SUPERADMIN', 'Deny doctor access to /admin/create-staff', async () => {
        const r = await request('POST', '/admin/create-staff', {}, tokens.doctor);
        return expectDenied(r);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 3: DOCTOR Features
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [3] DOCTOR ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('DOCTOR', 'GET /doctor/profile', async () => {
        const r = await request('GET', '/doctor/profile', null, tokens.doctor);
        if (r.status === 200 && r.data?.success) {
            ids.doctorOwnProfileId = r.data.data.doctor._id;
        }
        return expect(r, 200);
    });

    await test('DOCTOR', 'GET /doctor/dashboard-stats', async () => {
        const r = await request('GET', '/doctor/dashboard-stats', null, tokens.doctor);
        return expect(r, 200);
    });

    await test('DOCTOR', 'GET /doctor/appointments', async () => {
        const r = await request('GET', '/doctor/appointments', null, tokens.doctor);
        return expect(r, 200);
    });

    await test('DOCTOR', 'GET /doctor/prescriptions', async () => {
        const r = await request('GET', '/doctor/prescriptions', null, tokens.doctor);
        return expect(r, 200);
    });

    await test('DOCTOR', 'PATCH /doctor/availability (doctor updates own)', async () => {
        const r = await request('PATCH', '/doctor/availability', {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timeSlots: [
                { start: '09:00', end: '09:30' },
                { start: '09:30', end: '10:00' },
                { start: '10:00', end: '10:30' },
                { start: '10:30', end: '11:00' },
                { start: '14:00', end: '14:30' },
                { start: '14:30', end: '15:00' },
            ]
        }, tokens.doctor);
        return expect(r, 200);
    });

    await test('DOCTOR', 'GET /doctor/profile for doctor2', async () => {
        const r = await request('GET', '/doctor/profile', null, tokens.doctor2);
        return expect(r, 200);
    });

    await test('DOCTOR', 'Deny patient access to /doctor/profile', async () => {
        const r = await request('GET', '/doctor/profile', null, tokens.patient);
        return expectDenied(r);
    });

    await test('DOCTOR', 'Deny receptionist access to /doctor/prescriptions', async () => {
        const r = await request('GET', '/doctor/prescriptions', null, tokens.receptionist);
        return expectDenied(r);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 4: PATIENT Features — Browse & Profile
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [4] PATIENT — Profile & Doctors ━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('PATIENT', 'GET /patient/profile', async () => {
        const r = await request('GET', '/patient/profile', null, tokens.patient);
        if (r.status === 200 && r.data?.success) {
            ids.patientOwnProfileId = r.data.data.patient._id;
        }
        return expect(r, 200);
    });

    await test('PATIENT', 'PATCH /patient/profile (update allergies & emergency contact)', async () => {
        const r = await request('PATCH', '/patient/profile', {
            bloodGroup: 'B+',
            emergencyContact: { name: 'Ravi Mittal', relationship: 'Father', phone: '9100000005' },
            allergies: ['Penicillin', 'Aspirin']
        }, tokens.patient);
        return expect(r, 200);
    });

    await test('PATIENT', 'GET /patient/doctors (list available)', async () => {
        const r = await request('GET', '/patient/doctors', null, tokens.patient);
        if (r.status === 200 && r.data?.success) {
            ids.bookDoctorId = r.data.data.doctors[0]?._id;
            return { ok: true, detail: r.data.data.doctors.length + ' doctors available' };
        }
        return expect(r, 200);
    });

    await test('PATIENT', 'GET /patient/doctor/:id/availability', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id available' };
        const r = await request('GET', '/patient/doctor/' + ids.bookDoctorId + '/availability', null, tokens.patient);
        return expect(r, 200);
    });

    await test('PATIENT', 'Deny doctor access to /patient/bills', async () => {
        const r = await request('GET', '/patient/bills', null, tokens.doctor);
        return expectDenied(r);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 5: APPOINTMENT LIFECYCLE
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [5] APPOINTMENT LIFECYCLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Find next Monday
    // Generate a test date (a Monday in the future to avoid collisions between runs)
    const nextMonday = (() => {
        const d = new Date();
        const weekOffset = Math.floor(Math.random() * 50) + 1; // Random week from 1 to 50
        d.setDate(d.getDate() + ((1 + 7 - d.getDay()) % 7 || 7) + (weekOffset * 7));
        return d.toISOString().split('T')[0];
    })();

    // Main appointment (slot 09:00-09:30)
    await test('APPOINTMENT', 'POST /appointments/book (patient books slot 09:00)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id to book' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '09:00', end: '09:30' },
            symptoms: 'Integration test — fever and headache',
            consultationType: 'in-person'
        }, tokens.patient);
        if (r.status === 201 && r.data?.success) {
            ids.appointmentId = r.data.data.appointment._id;
            return { ok: true, detail: 'Appointment ' + ids.appointmentId + ' on ' + nextMonday };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('APPOINTMENT', 'Prevent double-booking same slot', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '09:00', end: '09:30' },
            symptoms: 'Duplicate attempt',
        }, tokens.patient2);
        return expect(r, 400, false);
    });

    await test('APPOINTMENT', 'GET /appointments (patient view)', async () => {
        const r = await request('GET', '/appointments', null, tokens.patient);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'GET /appointments (doctor view)', async () => {
        const r = await request('GET', '/appointments', null, tokens.doctor);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'GET /appointments (receptionist — sees all)', async () => {
        const r = await request('GET', '/appointments', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'GET /appointments (superadmin — sees all)', async () => {
        const r = await request('GET', '/appointments', null, tokens.superadmin);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'PATCH /receptionist/appointment/:id/confirm', async () => {
        if (!ids.appointmentId) return { ok: false, detail: 'No appointment to confirm' };
        const r = await request('PATCH', '/receptionist/appointment/' + ids.appointmentId + '/confirm', {}, tokens.receptionist);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'PATCH /appointments/:id/status -> completed (doctor)', async () => {
        if (!ids.appointmentId) return { ok: false, detail: 'No appointment to complete' };
        const r = await request('PATCH', '/appointments/' + ids.appointmentId + '/status', { status: 'completed' }, tokens.doctor);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'GET /appointments/:id detail (doctor)', async () => {
        if (!ids.appointmentId) return { ok: false, detail: 'Missing ids' };
        const r = await request('GET', '/appointments/' + ids.appointmentId, null, tokens.doctor);
        return expect(r, 200);
    });

    // Book 2nd appointment for receptionist cancel
    let appointmentIdForRecepCancel;
    await test('APPOINTMENT', 'POST /appointments/book (2nd slot — for receptionist cancel)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '09:30', end: '10:00' },
            symptoms: 'Test 2 — cancel flow',
        }, tokens.patient);
        if (r.status === 201 && r.data?.success) {
            appointmentIdForRecepCancel = r.data.data.appointment._id;
            return { ok: true, detail: 'Appointment ' + appointmentIdForRecepCancel };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('APPOINTMENT', 'PATCH /receptionist/appointment/:id/cancel', async () => {
        if (!appointmentIdForRecepCancel) return { ok: false, detail: 'No 2nd appointment' };
        const r = await request('PATCH', '/receptionist/appointment/' + appointmentIdForRecepCancel + '/cancel', { reason: 'Test cancellation' }, tokens.receptionist);
        return expect(r, 200);
    });

    // Book 3rd for patient self-cancel
    let appointmentIdForPatientCancel;
    await test('APPOINTMENT', 'POST /appointments/book (3rd slot — patient self-cancel)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '10:00', end: '10:30' },
            symptoms: 'Test 3 — patient cancel',
        }, tokens.patient);
        if (r.status === 201 && r.data?.success) {
            appointmentIdForPatientCancel = r.data.data.appointment._id;
            return { ok: true, detail: 'Appointment ' + appointmentIdForPatientCancel };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('APPOINTMENT', 'PATCH /appointments/:id/cancel (patient cancels own)', async () => {
        if (!appointmentIdForPatientCancel) return { ok: false, detail: 'No 3rd appointment' };
        const r = await request('PATCH', '/appointments/' + appointmentIdForPatientCancel + '/cancel', { reason: 'Changed my mind' }, tokens.patient);
        return expect(r, 200);
    });

    await test('APPOINTMENT', 'Deny patient from booking slot reserved by receptionist (not applicable role)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '10:30', end: '11:00' },
        }, tokens.receptionist); // receptionist should NOT book — patient-only route
        return expectDenied(r);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 6: PRESCRIPTION FLOW
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [6] PRESCRIPTION FLOW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Book a fresh appointment specifically for the prescription flow
    let prescriptionApptId;
    await test('PRESCRIPTION', 'Book fresh appointment for prescription flow (slot 14:00)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '14:00', end: '14:30' },
            symptoms: 'Prescription flow test — headache',
        }, tokens.patient);
        if (r.status === 201 && r.data?.success) {
            prescriptionApptId = r.data.data.appointment._id;
            return { ok: true, detail: 'Appointment ' + prescriptionApptId };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('PRESCRIPTION', 'Receptionist confirms prescription appointment', async () => {
        if (!prescriptionApptId) return { ok: false, detail: 'No appointment' };
        const r = await request('PATCH', '/receptionist/appointment/' + prescriptionApptId + '/confirm', {}, tokens.receptionist);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'Doctor marks prescription appointment completed', async () => {
        if (!prescriptionApptId) return { ok: false, detail: 'No appointment' };
        const r = await request('PATCH', '/appointments/' + prescriptionApptId + '/status', { status: 'completed' }, tokens.doctor);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'POST /doctor/prescription (doctor writes Rx)', async () => {
        if (!prescriptionApptId) return { ok: false, detail: 'No completed appointment' };
        const r = await request('POST', '/doctor/prescription', {
            appointmentId: prescriptionApptId,
            diagnosis: 'Viral fever with mild headache — integration test',
            medicines: [
                { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Every 6 hours', duration: '3 days' },
                { name: 'ORS Sachets', dosage: '1 sachet', frequency: 'After meals', duration: '3 days' },
            ],
            tests: ['CBC', 'Urine Routine'],
            advice: 'Take complete bed rest, drink plenty of fluids.',
            followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }, tokens.doctor);
        if (r.status === 201 && r.data?.success) {
            ids.prescriptionId = r.data.data.prescription._id;
            return { ok: true, detail: 'Prescription ' + ids.prescriptionId + ' created' };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('PRESCRIPTION', 'GET /doctor/prescriptions (doctor lists all Rx)', async () => {
        const r = await request('GET', '/doctor/prescriptions', null, tokens.doctor);
        if (r.status === 200 && r.data?.success && !ids.prescriptionId) {
            ids.prescriptionId = r.data.data.prescriptions?.[0]?._id;
        }
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'GET /doctor/prescription/appointment/:id', async () => {
        if (!prescriptionApptId) return { ok: false, detail: 'No appointment id' };
        const r = await request('GET', '/doctor/prescription/appointment/' + prescriptionApptId, null, tokens.doctor);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'PATCH /doctor/prescription/:id (doctor updates advice)', async () => {
        if (!ids.prescriptionId) return { ok: false, detail: 'No prescription to update' };
        const r = await request('PATCH', '/doctor/prescription/' + ids.prescriptionId, {
            advice: 'Updated: rest + fluids + light diet.',
        }, tokens.doctor);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'GET /patient/prescriptions (patient reads own Rx)', async () => {
        const r = await request('GET', '/patient/prescriptions', null, tokens.patient);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'GET /receptionist/patient/:id/prescriptions', async () => {
        if (!ids.patientProfileId) return { ok: false, detail: 'No patient profile id' };
        const r = await request('GET', '/receptionist/patient/' + ids.patientProfileId + '/prescriptions', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('PRESCRIPTION', 'GET /doctor/patient/:id/history', async () => {
        if (!ids.patientProfileId) return { ok: false, detail: 'No patient profile id' };
        const r = await request('GET', '/doctor/patient/' + ids.patientProfileId + '/history', null, tokens.doctor);
        return expect(r, 200);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 7: BILL FLOW
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [7] BILLING FLOW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('BILLING', 'POST /receptionist/bill (create bill with items)', async () => {
        const targetPatientId = ids.patientOwnProfileId || ids.patientProfileId;
        if (!targetPatientId) return { ok: false, detail: 'No patient profile id' };
        const r = await request('POST', '/receptionist/bill', {
            patientId: targetPatientId,
            appointmentId: ids.appointmentId,
            items: [
                { description: 'Consultation Fee — Dr. Rajesh Verma', quantity: 1, unitPrice: 500 },
                { description: 'Blood Test (CBC)', quantity: 1, unitPrice: 300 },
                { description: 'Urine Routine Analysis', quantity: 1, unitPrice: 150 },
            ],
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }, tokens.receptionist);
        if (r.status === 201 && r.data?.success) {
            ids.billId = r.data.data.bill._id;
            return { ok: true, detail: 'Bill ' + ids.billId + ' — total Rs.' + r.data.data.bill.total?.toFixed(2) };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('BILLING', 'GET /receptionist/bills (receptionist lists all)', async () => {
        const r = await request('GET', '/receptionist/bills', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('BILLING', 'GET /patient/bills (patient sees own)', async () => {
        const r = await request('GET', '/patient/bills', null, tokens.patient);
        return expect(r, 200);
    });

    await test('BILLING', 'PATCH /receptionist/bill/:id/mark-paid', async () => {
        if (!ids.billId) return { ok: false, detail: 'No bill to mark paid' };
        const r = await request('PATCH', '/receptionist/bill/' + ids.billId + '/mark-paid', {}, tokens.receptionist);
        return expect(r, 200);
    });

    await test('BILLING', 'Deny patient from marking bill paid', async () => {
        if (!ids.billId) return { ok: false, detail: 'No bill id' };
        const r = await request('PATCH', '/receptionist/bill/' + ids.billId + '/mark-paid', {}, tokens.patient);
        return expectDenied(r);
    });

    await test('BILLING', 'Rejection on bill with invalid patient ID', async () => {
        const r = await request('POST', '/receptionist/bill', {
            patientId: '000000000000000000000000',
            items: [{ description: 'Test', quantity: 1, unitPrice: 100 }],
        }, tokens.receptionist);
        return expect(r, 404, false);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 8: LAB REPORT FLOW
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [8] LAB REPORT FLOW ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('LAB REPORT', 'POST /receptionist/lab-report without file (validates guard)', async () => {
        if (!ids.patientProfileId) return { ok: false, detail: 'No patient profile id' };
        const r = await request('POST', '/receptionist/lab-report', {
            patientId: ids.patientProfileId,
            testName: 'Complete Blood Count',
            testType: 'Haematology',
            reportDate: new Date().toISOString()
        }, tokens.receptionist);
        return expect(r, 400, false);
    });

    await test('LAB REPORT', 'GET /receptionist/lab-reports', async () => {
        const r = await request('GET', '/receptionist/lab-reports', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('LAB REPORT', 'GET /receptionist/lab-reports?patientId=... (filtered)', async () => {
        if (!ids.patientProfileId) return { ok: false, detail: 'No patient id' };
        const r = await request('GET', '/receptionist/lab-reports?patientId=' + ids.patientProfileId, null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('LAB REPORT', 'GET /patient/lab-reports (patient sees own)', async () => {
        const r = await request('GET', '/patient/lab-reports', null, tokens.patient);
        return expect(r, 200);
    });

    await test('LAB REPORT', 'Deny doctor access to /receptionist/lab-reports', async () => {
        const r = await request('GET', '/receptionist/lab-reports', null, tokens.doctor);
        return expectDenied(r);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 9: DOCUMENT DOWNLOADS
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [9] DOCUMENT DOWNLOADS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('DOCUMENTS', 'GET /documents/download/bill/:id PDF (as receptionist)', async () => {
        if (!ids.billId) return { ok: false, detail: 'No bill id' };
        const r = await request('GET', '/documents/download/bill/' + ids.billId, null, tokens.receptionist);
        const ok = r.status === 200;
        return { ok, detail: ok ? 'PDF stream HTTP 200' : 'HTTP ' + r.status + ' — ' + (r.data?.message || '') };
    });

    await test('DOCUMENTS', 'GET /documents/download/bill/:id PDF (as patient — own bill)', async () => {
        if (!ids.billId) return { ok: false, detail: 'No bill id' };
        const r = await request('GET', '/documents/download/bill/' + ids.billId, null, tokens.patient);
        const ok = r.status === 200;
        return { ok, detail: ok ? 'PDF stream HTTP 200' : 'HTTP ' + r.status + ' — ' + (r.data?.message || '') };
    });

    await test('DOCUMENTS', 'Deny unauthenticated /documents/download/bill', async () => {
        if (!ids.billId) return { ok: false, detail: 'No bill id' };
        const r = await request('GET', '/documents/download/bill/' + ids.billId, null, null);
        return expectDenied(r);
    });

    await test('DOCUMENTS', '404 on invalid document type', async () => {
        const r = await request('GET', '/documents/download/invalid-type/000000000000000000000000', null, tokens.receptionist);
        return expect(r, 400, false);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 10: DOCTOR AVAILABILITY & LEAVES
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [10] AVAILABILITY & LEAVES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('AVAILABILITY', 'GET /receptionist/doctors/availability', async () => {
        const r = await request('GET', '/receptionist/doctors/availability', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('AVAILABILITY', 'PATCH /receptionist/doctors/:id/availability', async () => {
        if (!ids.doctorProfileId) return { ok: false, detail: 'No doctor profile id' };
        const r = await request('PATCH', '/receptionist/doctors/' + ids.doctorProfileId + '/availability', {
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            timeSlots: [{ start: '09:00', end: '09:30' }, { start: '09:30', end: '10:00' }]
        }, tokens.receptionist);
        return expect(r, 200);
    });

    const leaveDate = (() => {
        const d = new Date(nextMonday);
        d.setDate(d.getDate() + 7);
        return d.toISOString().split('T')[0];
    })();

    await test('AVAILABILITY', 'POST /receptionist/doctors/:id/leave (add leave)', async () => {
        if (!ids.doctorProfileId) return { ok: false, detail: 'No doctor profile id' };
        const r = await request('POST', '/receptionist/doctors/' + ids.doctorProfileId + '/leave', { date: leaveDate }, tokens.receptionist);
        return expect(r, 200);
    });

    await test('AVAILABILITY', 'Prevent duplicate leave on same date', async () => {
        if (!ids.doctorProfileId) return { ok: false, detail: 'No doctor profile id' };
        const r = await request('POST', '/receptionist/doctors/' + ids.doctorProfileId + '/leave', { date: leaveDate }, tokens.receptionist);
        return expect(r, 400, false);
    });

    await test('AVAILABILITY', 'Patient cannot book on doctor leave date', async () => {
        const targetDoctorId = ids.doctorProfileId || ids.bookDoctorId;
        if (!targetDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: targetDoctorId,
            date: leaveDate,
            timeSlot: { start: '09:00', end: '09:30' },
            symptoms: 'Test leave date booking',
        }, tokens.patient);
        return expect(r, 400, false); // Should be blocked by leave check
    });

    await test('AVAILABILITY', 'GET /receptionist/doctors/:id/leaves', async () => {
        if (!ids.doctorProfileId) return { ok: false, detail: 'No doctor profile id' };
        const r = await request('GET', '/receptionist/doctors/' + ids.doctorProfileId + '/leaves', null, tokens.receptionist);
        return expect(r, 200);
    });

    await test('AVAILABILITY', 'DELETE /receptionist/doctors/:id/leave/:date (remove)', async () => {
        if (!ids.doctorProfileId) return { ok: false, detail: 'No doctor profile id' };
        const r = await request('DELETE', '/receptionist/doctors/' + ids.doctorProfileId + '/leave/' + leaveDate, null, tokens.receptionist);
        return expect(r, 200);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 11: PATIENT REGISTRATION
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [11] PATIENT REGISTRATION ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const newPatientEmail = 'testpatient.' + Date.now() + '@gmail.com';
    await test('REGISTRATION', 'POST /auth/register (new patient)', async () => {
        const r = await request('POST', '/auth/register', {
            firstName: 'Integration',
            lastName: 'TestPatient',
            email: newPatientEmail,
            password: 'Test@1234',
            phone: '9876543210'
        });
        if (r.status === 201 && r.data?.success) {
            ids.newPatientToken = r.data.data.tokens.accessToken;
            ids.newPatientUserId = r.data.data.user._id;
            return { ok: true, detail: 'Registered ' + newPatientEmail };
        }
        return { ok: false, detail: 'HTTP ' + r.status + ' — ' + r.data?.message };
    });

    await test('REGISTRATION', 'Reject duplicate email registration', async () => {
        const r = await request('POST', '/auth/register', {
            firstName: 'Dup', lastName: 'User',
            email: newPatientEmail, password: 'Test@1234', phone: '9876543211'
        });
        return expect(r, 400, false);
    });

    await test('REGISTRATION', 'New patient can GET /patient/profile', async () => {
        if (!ids.newPatientToken) return { ok: false, detail: 'No token for new patient' };
        const r = await request('GET', '/patient/profile', null, ids.newPatientToken);
        return expect(r, 200);
    });

    await test('REGISTRATION', 'New patient can see list of doctors', async () => {
        if (!ids.newPatientToken) return { ok: false, detail: 'No token' };
        const r = await request('GET', '/patient/doctors', null, ids.newPatientToken);
        return expect(r, 200);
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 12: CHATBOT
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [12] CHATBOT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('CHATBOT', 'GET /chatbot/status (auth required)', async () => {
        const r = await request('GET', '/chatbot/status', null, tokens.patient);
        return expect(r, 200);
    });

    await test('CHATBOT', 'GET /chatbot/topics (auth required)', async () => {
        const r = await request('GET', '/chatbot/topics', null, tokens.patient);
        return expect(r, 200);
    });

    await test('CHATBOT', 'POST /chatbot/chat — health query (no auth, public endpoint)', async () => {
        // /chatbot/chat is public — no auth middleware
        const r = await request('POST', '/chatbot/chat', { message: 'What are common symptoms of fever?' }, null);
        // 200 OK or 503 if no Groq keys — both valid. 404/500 = fail
        const ok = [200, 503].includes(r.status);
        return { ok, detail: 'HTTP ' + r.status + (r.data?.data?.response ? ' — got reply' : r.data?.message ? ' — ' + r.data.message : '') };
    });

    await test('CHATBOT', 'POST /chatbot/chat — non-health query returns graceful off-topic reply', async () => {
        const r = await request('POST', '/chatbot/chat', { message: 'Who won the cricket World Cup 2023?' }, null);
        // Should return 200 with isHealthRelated: false (content filtered without calling Groq)
        const ok = r.status === 200 && r.data?.success === true && r.data?.data?.isHealthRelated === false;
        return { ok, detail: 'HTTP ' + r.status + ' isHealthRelated=' + r.data?.data?.isHealthRelated };
    });

    // ═══════════════════════════════════════════════════════════════
    // SECTION 13: ACCESS CONTROL GUARDS (cross-role)
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [13] ACCESS CONTROL GUARDS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await test('ACCESS', 'Patient cannot access /admin/analytics', async () => {
        const r = await request('GET', '/admin/analytics', null, tokens.patient);
        return expectDenied(r);
    });

    await test('ACCESS', 'Doctor cannot access /admin/create-staff', async () => {
        const r = await request('POST', '/admin/create-staff', {}, tokens.doctor);
        return expectDenied(r);
    });

    await test('ACCESS', 'Receptionist cannot create prescription', async () => {
        const r = await request('POST', '/doctor/prescription', {}, tokens.receptionist);
        return expectDenied(r);
    });

    await test('ACCESS', 'Receptionist cannot book appointments (patient-only)', async () => {
        if (!ids.bookDoctorId) return { ok: false, detail: 'No doctor id' };
        const r = await request('POST', '/appointments/book', {
            doctorId: ids.bookDoctorId,
            date: nextMonday,
            timeSlot: { start: '10:30', end: '11:00' },
        }, tokens.receptionist);
        return expectDenied(r);
    });

    await test('ACCESS', 'Doctor cannot access /patient/bills', async () => {
        const r = await request('GET', '/patient/bills', null, tokens.doctor);
        return expectDenied(r);
    });

    await test('ACCESS', 'Patient cannot access /admin/system-overview', async () => {
        const r = await request('GET', '/admin/system-overview', null, tokens.patient);
        return expectDenied(r);
    });

    await test('ACCESS', 'Expired/invalid token is rejected', async () => {
        const r = await request('GET', '/auth/me', null, 'invalid.jwt.token');
        return expectDenied(r);
    });

    await test('ACCESS', 'Superadmin can access /admin/export', async () => {
        const r = await request('GET', '/admin/export', null, tokens.superadmin);
        // Could be 200 or a redirect/file response — should NOT be 401/403/500
        const ok = ![401, 403, 500].includes(r.status);
        return { ok, detail: 'HTTP ' + r.status };
    });

    // ═══════════════════════════════════════════════════════════════
    // CLEANUP
    // ═══════════════════════════════════════════════════════════════
    console.log('━━━ [CLEANUP] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    if (ids.newStaffUserId) {
        await request('PATCH', '/admin/user/' + ids.newStaffUserId + '/status', { isActive: false }, tokens.superadmin);
        console.log('  Deactivated test staff user');
    }
    if (ids.newDoctorUserId) {
        await request('PATCH', '/admin/user/' + ids.newDoctorUserId + '/status', { isActive: false }, tokens.superadmin);
        console.log('  Deactivated test doctor user');
    }
    if (ids.newPatientUserId) {
        await request('PATCH', '/admin/user/' + ids.newPatientUserId + '/status', { isActive: false }, tokens.superadmin);
        console.log('  Deactivated test patient (registered during test)');
    }

    // ═══════════════════════════════════════════════════════════════
    // FINAL REPORT
    // ═══════════════════════════════════════════════════════════════
    const total = pass + fail;
    const pct = total > 0 ? Math.round((pass / total) * 100) : 0;

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║  TEST RESULTS: ' + pass + '/' + total + ' PASSED  (' + pct + '%)' + ''.padEnd(40 - String(pass + '/' + total + ' PASSED  (' + pct + '%)').length) + '║');
    console.log('╠══════════════════════════════════════════════════════════════╣');

    const groups = [...new Set(results.map(r => r.group))];
    for (const g of groups) {
        const groupTests = results.filter(r => r.group === g);
        const gPass = groupTests.filter(r => r.status === 'PASS').length;
        const indicator = gPass === groupTests.length ? '✅' : '⚠️ ';
        const line = '  ' + indicator + ' ' + g.padEnd(22) + gPass + '/' + groupTests.length + ' passed';
        console.log('║' + line.padEnd(62) + '║');
    }

    console.log('╠══════════════════════════════════════════════════════════════╣');

    const failures = results.filter(r => r.status !== 'PASS');
    if (failures.length === 0) {
        console.log('║  🎉  All ' + total + ' tests passed! System fully operational.'.padEnd(60) + '║');
    } else {
        console.log('║  FAILURES (' + failures.length + '):'.padEnd(62) + '║');
        for (const f of failures) {
            const icon = f.status === 'ERROR' ? '💥' : '❌';
            const line = '  ' + icon + ' [' + f.group + '] ' + f.name;
            console.log('║' + line.substring(0, 62).padEnd(62) + '║');
            if (f.detail) {
                const detail = '       ' + f.detail;
                console.log('║' + detail.substring(0, 62).padEnd(62) + '║');
            }
        }
    }

    console.log('╚══════════════════════════════════════════════════════════════╝\n');

    process.exit(failures.length > 0 ? 1 : 0);
})();
