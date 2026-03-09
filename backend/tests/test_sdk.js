const { cloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');
const LabReport = require('../models/LabReport');
require('dotenv').config();

async function testCloudinarySDK() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('--- DB Connected ---');

        const id = '699b2298910c77de3da2925a';
        const report = await LabReport.findById(id);

        if (!report) {
            console.log('Report not found');
            return;
        }

        const url = report.reportFile;
        console.log('URL in DB:', url);

        // Extract Public ID from URL
        // Example: https://res.cloudinary.com/detmmsjbu/image/upload/v1771774619/OrvantaHealth/lab-reports/lbs7hpy02hygxhgepuqp.pdf
        const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/;
        const match = url.match(regex);
        const publicId = match ? match[1] : null;

        if (!publicId) {
            console.log('Could not extract publicId');
            return;
        }

        console.log('Extracted Public ID:', publicId);

        console.log('\n--- Attempting to fetch resource info via Admin API ---');
        try {
            const resource = await cloudinary.api.resource(publicId, { resource_type: 'image' });
            console.log('Resource Info Found:');
            console.log('Type:', resource.type); // 'upload', 'private', or 'authenticated'
            console.log('Format:', resource.format);
            console.log('Access Control:', resource.access_control);

            console.log('\n--- Generating Signed URL ---');
            const signedUrl = cloudinary.url(publicId, {
                sign_url: true,
                type: resource.type,
                secure: true,
                resource_type: 'image'
            });
            console.log('Signed URL:', signedUrl);

            // Test if signed URL works
            const axios = require('axios');
            try {
                const testFetch = await axios.get(signedUrl, { responseType: 'arraybuffer', timeout: 5000 });
                console.log('SUCCESS: Signed URL is accessible! Status:', testFetch.status);
            } catch (fetchErr) {
                console.error('FAILURE: Signed URL also inaccessible:', fetchErr.message);
            }

        } catch (apiErr) {
            console.error('Admin API Error:', apiErr.message);
            if (apiErr.message.includes('not found')) {
                console.log('Maybe it is resource_type: "raw"? Trying that...');
                try {
                    const resourceRaw = await cloudinary.api.resource(publicId, { resource_type: 'raw' });
                    console.log('Found as RAW resource!');
                    // ... same logic for signed URL
                } catch (e2) {
                    console.error('Still not found as RAW.');
                }
            }
        }

    } catch (err) {
        console.error('Fatal:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testCloudinarySDK();
