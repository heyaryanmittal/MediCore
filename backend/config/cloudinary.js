const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const labReportStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let ext = file.mimetype.split('/')[1] || 'pdf';
        if (ext === 'jpeg') ext = 'jpg';
        const isPdf = ext === 'pdf';
        return {
            folder: 'MediCore/lab-reports',
            allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
            format: isPdf ? undefined : ext,
            resource_type: isPdf ? 'raw' : 'image'
        };
    }
});

const prescriptionStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        let ext = file.mimetype.split('/')[1] || 'pdf';
        if (ext === 'jpeg') ext = 'jpg';
        const isPdf = ext === 'pdf';
        return {
            folder: 'MediCore/prescriptions',
            allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
            format: isPdf ? undefined : ext,
            resource_type: isPdf ? 'raw' : 'image'
        };
    }
});

const profilePicStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'MediCore/profiles',
        allowed_formats: ['jpg', 'png', 'jpeg'],
        resource_type: 'image'
    }
});

module.exports = {
    cloudinary,
    labReportStorage,
    prescriptionStorage,
    profilePicStorage
};
