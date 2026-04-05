const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { labReportStorage } = require('../config/cloudinary');

// Configure multer for general document uploads
const upload = multer({
  storage: labReportStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
const Prescription = require('../models/Prescription');
const { cloudinary } = require('../config/cloudinary');
const Bill = require('../models/Bill');
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

router.use(authenticateToken);

// ---------------------------------------------------------------------------
// POST: Upload document (patient/doctor)
// ---------------------------------------------------------------------------
router.post('/upload', upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                document: {
                    name: req.file.originalname,
                    url: req.file.path, // Cloudinary URL
                    mimetype: req.file.mimetype,
                    size: req.file.size
                }
            }
        });
    } catch (error) {
        console.error('Document upload error:', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

// ---------------------------------------------------------------------------
// Helper: generate a PDF invoice for a bill and pipe it to the response
// ---------------------------------------------------------------------------
const generateBillPDF = (bill, res, filename) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill('#0d9488');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
        .text('MediCore', 50, 28);
    doc.fontSize(10).font('Helvetica')
        .text('Hospital Management System', 50, 58);
    doc.fillColor('#0d9488').fontSize(20).font('Helvetica-Bold')
        .text('INVOICE', 0, 28, { align: 'right', width: doc.page.width - 50 });
    doc.moveDown(4);

    // ── Bill Meta ────────────────────────────────────────────────────────────
    const billNum = bill.billNumber || bill._id.toString().slice(-6).toUpperCase();
    const createdAt = bill.createdAt ? new Date(bill.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';
    const dueDate = bill.dueDate ? new Date(bill.dueDate).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';

    const metaY = doc.y;
    // Left column
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text('Bill To:', 50, metaY);
    const patientName = bill.patientId?.userId?.profile
        ? `${bill.patientId.userId.profile.firstName || ''} ${bill.patientId.userId.profile.lastName || ''}`.trim()
        : 'Patient';
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(patientName, 50, metaY + 16);

    // Right column
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text(`Invoice #: ${billNum}`, 350, metaY, { align: 'left' });
    doc.fillColor('#6B7280').font('Helvetica').fontSize(9)
        .text(`Date: ${createdAt}`, 350, metaY + 16)
        .text(`Due: ${dueDate}`, 350, metaY + 30);

    // Status badge
    const statusColor = bill.status === 'paid' ? '#16a34a' : bill.status === 'overdue' ? '#dc2626' : '#d97706';
    doc.fillColor(statusColor).fontSize(10).font('Helvetica-Bold')
        .text(bill.status.toUpperCase().replace('_', ' '), 350, metaY + 46);

    doc.moveDown(5);

    // ── Items Table ──────────────────────────────────────────────────────────
    const tableTop = doc.y + 10;
    const colDesc = 50, colQty = 310, colUnit = 380, colTotal = 460;

    // Table header
    doc.rect(50, tableTop, doc.page.width - 100, 24).fill('#0d9488');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
        .text('Description', colDesc + 4, tableTop + 7)
        .text('Qty', colQty, tableTop + 7, { width: 60, align: 'center' })
        .text('Unit Price', colUnit, tableTop + 7, { width: 70, align: 'right' })
        .text('Total', colTotal, tableTop + 7, { width: 60, align: 'right' });

    // Table rows
    let rowY = tableTop + 28;
    (bill.items || []).forEach((item, idx) => {
        const bg = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.rect(50, rowY - 4, doc.page.width - 100, 22).fill(bg);
        doc.fillColor('#111827').fontSize(9).font('Helvetica')
            .text(item.description || '-', colDesc + 4, rowY, { width: 250 })
            .text(String(item.quantity), colQty, rowY, { width: 60, align: 'center' })
            .text(`\u20B9${Number(item.unitPrice).toFixed(2)}`, colUnit, rowY, { width: 70, align: 'right' })
            .text(`\u20B9${Number(item.total).toFixed(2)}`, colTotal, rowY, { width: 60, align: 'right' });
        rowY += 24;
    });

    // ── Totals ────────────────────────────────────────────────────────────────
    rowY += 10;
    doc.moveTo(350, rowY).lineTo(510, rowY).strokeColor('#E5E7EB').stroke();
    rowY += 8;

    doc.fillColor('#374151').fontSize(9).font('Helvetica')
        .text('Subtotal:', 350, rowY)
        .text(`\u20B9${Number(bill.subtotal).toFixed(2)}`, 440, rowY, { width: 70, align: 'right' });
    rowY += 18;
    doc.text(`Tax (18%):`, 350, rowY)
        .text(`\u20B9${Number(bill.tax).toFixed(2)}`, 440, rowY, { width: 70, align: 'right' });
    rowY += 18;

    doc.rect(350, rowY, 160, 26).fill('#0d9488');
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
        .text('Total:', 356, rowY + 7)
        .text(`\u20B9${Number(bill.total).toFixed(2)}`, 440, rowY + 7, { width: 66, align: 'right' });

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
        .text('Thank you for choosing MediCore. For billing queries call +91-555-000-1111.',
            50, doc.page.height - 60, { align: 'center', width: doc.page.width - 100 });

    doc.end();
};

// ---------------------------------------------------------------------------
// Helper: generate a PDF for a prescription and pipe it to the response
// ---------------------------------------------------------------------------
const generatePrescriptionPDF = (prescription, res, filename) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 90).fill('#0d9488');
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
        .text('MediCore', 50, 28);
    doc.fontSize(10).font('Helvetica')
        .text('CLINICAL PRESCRIPTION', 50, 58);
    doc.fillColor('#0d9488').fontSize(20).font('Helvetica-Bold')
        .text('RX', 0, 28, { align: 'right', width: doc.page.width - 50 });
    doc.moveDown(4);

    // ── Prescription Meta ───────────────────────────────────────────────────
    const date = prescription.createdAt ? new Date(prescription.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'N/A';
    
    const metaY = doc.y;
    // Left column: Patient
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text('Patient:', 50, metaY);
    const patientName = prescription.patientId?.userId?.profile
        ? `${prescription.patientId.userId.profile.firstName || ''} ${prescription.patientId.userId.profile.lastName || ''}`.trim()
        : 'Patient';
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(patientName, 50, metaY + 16);

    // Right column: Doctor
    doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold').text('Doctor:', 350, metaY);
    const docName = prescription.doctorId?.userId?.profile
        ? `Dr. ${prescription.doctorId.userId.profile.firstName || ''} ${prescription.doctorId.userId.profile.lastName || ''}`.trim()
        : 'Doctor';
    const specialization = prescription.doctorId?.specialization || 'General Physician';
    doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(docName, 350, metaY + 16);
    doc.fillColor('#6B7280').fontSize(9).font('Helvetica').text(specialization, 350, metaY + 30);
    doc.text(`Date: ${date}`, 350, metaY + 44);

    doc.moveDown(4);

    // ── Diagnosis Section ───────────────────────────────────────────────────
    doc.rect(50, doc.y, doc.page.width - 100, 25).fill('#F3F4F6');
    doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold').text(`DIAGNOSIS: ${prescription.diagnosis || 'General Checkup'}`, 55, doc.y + 7);
    doc.moveDown(2.5);

    // ── Medications Table ───────────────────────────────────────────────────
    const tableTop = doc.y;
    doc.fillColor('#0d9488').fontSize(11).font('Helvetica-Bold').text('PRESCRIPTION (Rx)', 50, tableTop);
    doc.moveDown(1);

    const medicationY = doc.y;
    doc.rect(50, medicationY, doc.page.width - 100, 20).fill('#0d9488');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold')
        .text('Medicine Name', 55, medicationY + 6)
        .text('Dosage', 300, medicationY + 6)
        .text('Frequency', 380, medicationY + 6)
        .text('Duration', 480, medicationY + 6);

    let rowY = medicationY + 25;
    (prescription.medicines || []).forEach((med, idx) => {
        const bg = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
        doc.rect(50, rowY - 4, doc.page.width - 100, 22).fill(bg);
        doc.fillColor('#111827').fontSize(9).font('Helvetica')
            .text(med.name || '-', 55, rowY)
            .text(med.dosage || '-', 300, rowY)
            .text(med.frequency || '-', 380, rowY)
            .text(med.duration || '-', 480, rowY);
        
        if (med.instructions) {
            rowY += 15;
            doc.fillColor('#6B7280').fontSize(8).font('Helvetica-Oblique').text(`Note: ${med.instructions}`, 55, rowY);
            rowY += 10;
        } else {
            rowY += 22;
        }
    });

    // ── Tests & Advice ──────────────────────────────────────────────────────
    if (rowY > doc.page.height - 200) { doc.addPage(); rowY = 50; }
    
    if (prescription.tests && prescription.tests.length > 0) {
        rowY += 20;
        doc.fillColor('#0d9488').fontSize(11).font('Helvetica-Bold').text('SUGGESTED TESTS', 50, rowY);
        rowY += 20;
        prescription.tests.forEach(test => {
            doc.fillColor('#111827').fontSize(9).font('Helvetica').text(`\u2022 ${test.name}`, 60, rowY);
            rowY += 14;
        });
    }

    if (prescription.advice) {
        rowY += 20;
        doc.fillColor('#0d9488').fontSize(11).font('Helvetica-Bold').text('DOCTOR\'S ADVICE', 50, rowY);
        rowY += 20;
        doc.fillColor('#4B5563').fontSize(9).font('Helvetica').text(prescription.advice, 50, rowY, { width: 490 });
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    doc.fillColor('#9CA3AF').fontSize(8).font('Helvetica')
        .text('This is a computer-generated prescription. Valid without physical signature.',
            50, doc.page.height - 60, { align: 'center', width: doc.page.width - 100 });

    doc.end();
};

// Download document (shared among roles)
router.get('/download/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        let filePath;
        let filename;

        // Authorization logic
        if (!req.user || !req.user._id) {
            console.error('[Download] User not authenticated in request');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const userId = req.user._id;
        const role = req.user.role;

        switch (type) {
            case 'prescription':
                const prescription = await Prescription.findById(id)
                    .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } })
                    .populate({ path: 'doctorId', populate: { path: 'userId', select: 'profile' } });
                if (!prescription) {
                    return res.status(404).json({ success: false, message: 'Prescription not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    if (!patient || !prescription.patientId || prescription.patientId._id.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied' });
                    }
                }

                // If no receipt file, generate PDF on the fly
                if (!prescription.receipt) {
                    return generatePrescriptionPDF(prescription, res, `prescription_${id}.pdf`);
                }

                filePath = prescription.receipt;
                filename = `prescription_${id}.pdf`;
                break;

            case 'bill':
                const bill = await Bill.findById(id)
                    .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } });
                if (!bill) {
                    return res.status(404).json({ success: false, message: 'Bill not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    if (!patient || !bill.patientId || bill.patientId._id.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this bill' });
                    }
                }

                // If no uploaded receipt, generate PDF on the fly
                if (!bill.receipt) {
                    return generateBillPDF(bill, res, `bill_${id}.pdf`);
                }

                filePath = bill.receipt;
                filename = `bill_${id}.pdf`;
                break;

            case 'lab-report':
                const labReport = await LabReport.findById(id);
                if (!labReport) {
                    return res.status(404).json({ success: false, message: 'Lab report record not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    if (!patient || !labReport.patientId || labReport.patientId.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this lab report' });
                    }
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findOne({ userId });
                    // For doctors, we allow if they are the referring doctor OR if they have access (some systems allow all doctors to see reports)
                    // If your policy is strict, uncomment below:
                    /*
                    if (!doctor || !labReport.doctorId || labReport.doctorId.toString() !== doctor._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied' });
                    }
                    */
                }

                filePath = labReport.reportFile;
                filename = `lab_report_${id}.pdf`;
                break;

            default:
                return res.status(400).json({ success: false, message: 'Invalid document type requested' });
        }

        if (!filePath) {
            console.error(`[Download] File path (URL/filename) is missing in DB record for ${type}: ${id}`);
            return res.status(404).json({ success: false, message: 'File reference not found in database record' });
        }

        // If it's a Cloudinary URL or any full URL, proxy it
        if (filePath.startsWith('http')) {
            try {
                const response = await axios({
                    method: 'get',
                    url: filePath,
                    responseType: 'arraybuffer',
                    timeout: 45000
                });

                const contentType = response.headers['content-type'] || 'application/pdf';

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                return res.status(200).send(Buffer.from(response.data));
            } catch (proxyError) {
                console.error('[Download] Cloud Proxy Error:', {
                    message: proxyError.message,
                    status: proxyError.response?.status,
                    url: filePath
                });
                return res.status(502).json({
                    success: false,
                    message: 'Could not fetch file from cloud storage.',
                    error: proxyError.message
                });
            }
        }

        // Handle local files
        let subfolder = '';
        if (type === 'lab-report') subfolder = 'lab-reports';
        else if (type === 'prescription') subfolder = 'prescriptions';
        else if (type === 'bill') subfolder = 'bills';

        const fullPath = path.resolve(__dirname, '..', 'uploads', subfolder, filePath);

        return res.download(fullPath, filename, (err) => {
            if (err) {
                console.error(`[Download] Error during res.download for ${fullPath}:`, err);
                if (!res.headersSent) {
                    res.status(500).json({ success: false, message: 'Error downloading file from server storage', error: err.message });
                }
            }
        });
    } catch (error) {
        console.error('[Download] Global Route Error:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            type,
            id
        });

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'An unexpected internal error occurred while processing the download',
                error: error.message,
                debug: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
});

module.exports = router;
