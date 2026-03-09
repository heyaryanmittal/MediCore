const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const PDFDocument = require('pdfkit');
const { authenticateToken } = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const { cloudinary } = require('../config/cloudinary');
const Bill = require('../models/Bill');
const LabReport = require('../models/LabReport');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

router.use(authenticateToken);

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
        .text('OrvantaHealth', 50, 28);
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
        .text('Thank you for choosing OrvantaHealth. For billing queries call +91-555-000-1111.',
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
        console.log(`[Download] Starting download - Type: ${type}, ID: ${id}, User: ${userId}, Role: ${role}`);

        switch (type) {
            case 'prescription':
                const prescription = await Prescription.findById(id);
                if (!prescription) {
                    console.log(`[Download] Prescription not found: ${id}`);
                    return res.status(404).json({ success: false, message: 'Prescription not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    console.log(`[Auth] Patient Record Check - Found: ${!!patient}, Patient ID on Doc: ${prescription.patientId}`);
                    if (!patient || !prescription.patientId || prescription.patientId.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this prescription' });
                    }
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findOne({ userId });
                    console.log(`[Auth] Doctor Record Check - Found: ${!!doctor}, Doctor ID on Doc: ${prescription.doctorId}`);
                    if (!doctor || !prescription.doctorId || prescription.doctorId.toString() !== doctor._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this prescription' });
                    }
                }

                filePath = prescription.receipt;
                filename = `prescription_${id}.pdf`;
                break;

            case 'bill':
                const bill = await Bill.findById(id)
                    .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } });
                if (!bill) {
                    console.log(`[Download] Bill not found: ${id}`);
                    return res.status(404).json({ success: false, message: 'Bill not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    console.log(`[Auth] Patient Record Check - Found: ${!!patient}, Patient ID on Bill: ${bill.patientId}`);
                    if (!patient || !bill.patientId || bill.patientId._id.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this bill' });
                    }
                }

                // If no uploaded receipt, generate PDF on the fly
                if (!bill.receipt) {
                    console.log(`[Download] No receipt file on bill ${id} — generating PDF on the fly`);
                    return generateBillPDF(bill, res, `bill_${id}.pdf`);
                }

                filePath = bill.receipt;
                filename = `bill_${id}.pdf`;
                break;

            case 'lab-report':
                console.log(`[Download] Fetching lab report document: ${id}`);
                const labReport = await LabReport.findById(id);
                if (!labReport) {
                    console.log(`[Download] Lab report record not found in database: ${id}`);
                    return res.status(404).json({ success: false, message: 'Lab report record not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId });
                    console.log(`[Auth] Patient Record Check - Found: ${!!patient}, Patient ID on Report: ${labReport.patientId}`);
                    if (!patient || !labReport.patientId || labReport.patientId.toString() !== patient._id.toString()) {
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this lab report' });
                    }
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findOne({ userId });
                    console.log(`[Auth] Doctor Record Check - Found: ${!!doctor}, Doctor ID on Report: ${labReport.doctorId}`);
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
                console.log(`[Download] Invalid document type requested: ${type}`);
                return res.status(400).json({ success: false, message: 'Invalid document type requested' });
        }

        if (!filePath) {
            console.error(`[Download] File path (URL/filename) is missing in DB record for ${type}: ${id}`);
            return res.status(404).json({ success: false, message: 'File reference not found in database record' });
        }

        console.log(`[Download] File reference identified: ${filePath}`);

        // If it's a Cloudinary URL or any full URL, proxy it
        if (filePath.startsWith('http')) {
            try {
                console.log(`[Download] Processing Cloudinary file: ${filePath}`);

                // Extract publicId from the URL
                const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
                const match = filePath.match(regex);
                const publicId = match ? match[1] : null;

                if (!publicId) {
                    throw new Error('Could not extract Cloudinary Public ID from URL');
                }

                console.log(`[Download] Extracted Public ID: ${publicId}. Generating signed URL for proxy...`);

                // Generate a signed URL for internal backend use (valid for 1 hour)
                const signedUrl = cloudinary.url(publicId, {
                    sign_url: true,
                    secure: true,
                    resource_type: 'image', // PDFs are treated as images in Cloudinary transformations
                    expires_at: Math.floor(Date.now() / 1000) + 3600
                });

                console.log(`[Download] Proxying from signed URL...`);

                const response = await axios({
                    method: 'get',
                    url: signedUrl,
                    responseType: 'arraybuffer',
                    timeout: 45000
                });

                const contentType = response.headers['content-type'] || 'application/pdf';
                console.log(`[Download] Proxy download successful. Content-Type: ${contentType}, Size: ${response.data.length} bytes`);

                res.setHeader('Content-Type', contentType);
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                return res.status(200).send(Buffer.from(response.data));
            } catch (proxyError) {
                console.error('[Download] Cloudinary Proxy Error:', {
                    message: proxyError.message,
                    status: proxyError.response?.status,
                    url: filePath
                });
                return res.status(502).json({
                    success: false,
                    message: 'Could not fetch file from cloud storage. Please check Cloudinary dashboard settings (Strict Transformations).',
                    error: proxyError.message
                });
            }
        }

        // Handle local files
        console.log(`[Download] Handling as local file...`);
        let subfolder = '';
        if (type === 'lab-report') subfolder = 'lab-reports';
        else if (type === 'prescription') subfolder = 'prescriptions';
        else if (type === 'bill') subfolder = 'bills';

        const fullPath = path.resolve(__dirname, '..', 'uploads', subfolder, filePath);
        console.log(`[Download] Resolved local path: ${fullPath}`);

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
