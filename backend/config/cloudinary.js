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
    params: {
        folder: 'OrvantaHealth/lab-reports',
        allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
        resource_type: 'auto'
    }
});

const prescriptionStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'OrvantaHealth/prescriptions',
        allowed_formats: ['jpg', 'png', 'pdf', 'jpeg'],
        resource_type: 'auto'
    }
});

const profilePicStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'OrvantaHealth/profiles',
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
