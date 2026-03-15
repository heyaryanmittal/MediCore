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

// Download document (shared among roles)
router.get('/download/:type/:id', async (req, res) => {
    const { type, id } = req.params;
    try {
        console.log(`[DocumentDownload] Request received - Type: ${type}, ID: ${id}`);
        
        // Authorization logic - already verified by authenticateToken middleware
        if (!req.user || !req.user._id) {
            console.error('[DocumentDownload] CRITICAL: User context missing after authentication');
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized: Session context error' 
            });
        }

        const userId = req.user._id;
        const role = req.user.role;
        console.log(`[DocumentDownload] Auth Check: User ${userId} (${role}) requesting ${type}:${id}`);

        let filePath;
        let filename;

        switch (type) {
            case 'prescription':
                const prescription = await Prescription.findById(id).lean();
                if (!prescription) {
                    console.log(`[DocumentDownload] Prescription not found: ${id}`);
                    return res.status(404).json({ success: false, message: 'Prescription not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId }).lean();
                    if (!patient || !prescription.patientId || prescription.patientId.toString() !== patient._id.toString()) {
                        console.warn(`[DocumentDownload] Unauthorized patient access attempt to prescription ${id}`);
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this prescription' });
                    }
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findOne({ userId }).lean();
                    if (!doctor || !prescription.doctorId || prescription.doctorId.toString() !== doctor._id.toString()) {
                        console.warn(`[DocumentDownload] Unauthorized doctor access attempt to prescription ${id}`);
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this prescription' });
                    }
                }

                filePath = prescription.receipt;
                filename = `prescription_${id}.pdf`;
                break;

            case 'bill':
                const bill = await Bill.findById(id)
                    .populate({ path: 'patientId', populate: { path: 'userId', select: 'profile' } })
                    .lean();
                if (!bill) {
                    console.log(`[DocumentDownload] Bill not found: ${id}`);
                    return res.status(404).json({ success: false, message: 'Bill not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId }).lean();
                    if (!patient || !bill.patientId || bill.patientId._id.toString() !== patient._id.toString()) {
                        console.warn(`[DocumentDownload] Unauthorized patient access attempt to bill ${id}`);
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this bill' });
                    }
                }

                if (!bill.receipt) {
                    console.log(`[DocumentDownload] No receipt file on bill ${id} — generating PDF on the fly`);
                    return generateBillPDF(bill, res, `bill_${id}.pdf`);
                }

                filePath = bill.receipt;
                filename = `bill_${id}.pdf`;
                break;

            case 'lab-report':
                console.log(`[DocumentDownload] Fetching lab report: ${id}`);
                const labReport = await LabReport.findById(id).lean();
                if (!labReport) {
                    console.log(`[DocumentDownload] Lab report not found: ${id}`);
                    return res.status(404).json({ success: false, message: 'Lab report record not found' });
                }

                if (role === 'patient') {
                    const patient = await Patient.findOne({ userId }).lean();
                    if (!patient || !labReport.patientId || labReport.patientId.toString() !== patient._id.toString()) {
                        console.warn(`[DocumentDownload] Unauthorized patient access: User ${userId} -> Report ${id}`);
                        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view this lab report' });
                    }
                } else if (role === 'doctor') {
                    const doctor = await Doctor.findOne({ userId }).lean();
                    if (!doctor) return res.status(403).json({ success: false, message: 'Access denied: Doctor profile not found' });
                }

                filePath = labReport.reportFile;
                filename = `lab_report_${id}.pdf`;
                break;

            default:
                return res.status(400).json({ success: false, message: 'Invalid document type' });
        }

        if (!filePath) {
            return res.status(404).json({ success: false, message: 'File reference missing' });
        }

        // --- CLOUDINARY PROXY LOGIC ---
        if (filePath.startsWith('http')) {
            console.log(`\n--- [DocumentDownload] Multi-Attempt Proxy Started ---`);
            console.log(`Base Path: ${filePath}`);
            
            const tryFetch = async (targetUrl) => {
                const shortUrl = targetUrl.split('?')[0];
                return await axios({
                    method: 'get',
                    url: targetUrl,
                    responseType: 'arraybuffer',
                    timeout: 20000,
                    headers: { 'User-Agent': 'MediCore-Server/1.1' }
                });
            };

            const isCloudinary = filePath.includes('cloudinary.com');
            const urlsToTry = [];

            if (isCloudinary) {
                // Parse Cloudinary URL
                const regex = /\/([^/]+)\/(upload|authenticated|private)\/(?:v\d+\/)?(.+?)(?:\.([^.]+))?$/;
                const match = filePath.match(regex);
                
                if (match) {
                    const originalResType = match[1];
                    const delType = match[2];
                    const publicId = match[3];
                    const ext = match[4] || 'pdf';

                    // Generate variants
                    ['image', 'raw'].forEach(resType => {
                        // Variant A: Signed
                        try {
                            const signed = cloudinary.url(publicId, {
                                sign_url: true,
                                secure: true,
                                resource_type: resType,
                                type: delType,
                                format: ext
                            });
                            urlsToTry.push({ url: signed, desc: `Signed (${resType})` });
                        } catch (e) {}

                        // Variant B: Signed with Attachment flag
                        try {
                            const signedAttach = cloudinary.url(publicId, {
                                sign_url: true,
                                secure: true,
                                resource_type: resType,
                                type: delType,
                                format: ext,
                                flags: 'attachment'
                            });
                            urlsToTry.push({ url: signedAttach, desc: `Signed+Attach (${resType})` });
                        } catch (e) {}
                    });
                }
            }

            // Always add the original URL (force HTTPS)
            urlsToTry.push({ url: filePath.replace('http://', 'https://'), desc: 'Original (HTTPS)' });

            // Execute sequences
            let lastError;
            for (const item of urlsToTry) {
                try {
                    console.log(`[DocumentDownload] Trying ${item.desc}...`);
                    const response = await tryFetch(item.url);
                    console.log(`[DocumentDownload] SUCCESS: ${item.desc}`);
                    
                    const contentType = response.headers['content-type'] || 'application/pdf';
                    res.setHeader('Content-Type', contentType);
                    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                    res.setHeader('Cache-Control', 'private, max-age=3600');
                    return res.send(Buffer.from(response.data));
                } catch (err) {
                    const status = err.response?.status || 'ERR';
                    console.warn(`[DocumentDownload] FAIL (${status}): ${item.desc}`);
                    lastError = err;
                }
            }

            console.error(`--- [DocumentDownload] ALL PROXY ATTEMPTS FAILED ---`);
            const finalStatus = lastError?.response?.status || 500;
            return res.status(finalStatus).json({
                success: false,
                message: 'Document storage access failed after multiple attempts',
                error: lastError?.message
            });
        }

        // --- LOCAL FALLBACK ---
        try {
            const fullPath = path.resolve(__dirname, '..', filePath);
            return res.download(fullPath, filename);
        } catch (err) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

    } catch (error) {
        console.error('[DocumentDownload] Global Route Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }
});

module.exports = router;
