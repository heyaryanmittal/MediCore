const { cloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');
const LabReport = require('../models/LabReport');
const axios = require('axios');
require('dotenv').config();

async function testCloudinaryFinal() {
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

        // Extract Public ID and Extension correctly
        const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.([^.]+))?$/;
        const match = url.match(regex);
        const publicId = match ? match[1] : null;
        const extension = match ? match[2] : 'pdf';

        if (!publicId) {
            console.log('Could not extract publicId');
            return;
        }

        console.log('Extracted Public ID:', publicId);
        console.log('Extracted Extension:', extension);

        const resourceTypes = ['image', 'raw'];

        for (const rType of resourceTypes) {
            console.log(`\n--- Testing with resource_type: "${rType}" ---`);
            try {
                // Determine the correct type (upload, private, authenticated)
                const resource = await cloudinary.api.resource(publicId, { resource_type: rType });
                console.log(`Resource Found! Type: ${resource.type}, Format: ${resource.format}`);

                console.log('Generating Signed URL...');
                const signedUrl = cloudinary.url(publicId, {
                    sign_url: true,
                    type: resource.type,
                    secure: true,
                    resource_type: rType,
                    format: extension, // CRITICAL: must include extension if asset was uploaded with it
                    version: resource.version
                });
                console.log('Signed URL:', signedUrl);

                try {
                    const testFetch = await axios.get(signedUrl, { responseType: 'arraybuffer', timeout: 5000 });
                    console.log(`SUCCESS with ${rType}! Status:`, testFetch.status, 'Size:', testFetch.data.length);
                } catch (fetchErr) {
                    console.error(`FAILURE with Signed URL (${rType}):`, fetchErr.message);
                    if (fetchErr.response) console.log('HTTP Status From Cloudinary:', fetchErr.response.status);
                }
            } catch (apiErr) {
                console.log(`Resource NOT found via API as ${rType}:`, apiErr.message);
            }
        }

    } catch (err) {
        console.error('Fatal:', err);
    } finally {
        await mongoose.disconnect();
    }
}

testCloudinaryFinal();
