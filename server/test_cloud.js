require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const axios = require('axios');
const File = require('./src/models/File');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function test() {
    await mongoose.connect(process.env.MONGODB_URI);
    const file = await File.findById("69afe8f3a9a4a365c7743bf7");
    if (!file) {
        console.log("File not found");
        process.exit(1);
    }
    console.log("File URL:", file.file_url);
    console.log("Public ID:", file.cloudinary_public_id);
    console.log("Resource Type:", file.cloudinary_resource_type);
    
    // Test 1: plain fetch
    try {
        await axios.get(file.file_url);
        console.log("Plain fetch SUCCESS");
    } catch (e) {
        console.log("Plain fetch FAILED:", e.response ? e.response.status : e.message);
    }

    // Test 2: signed url
    const signedUrl = cloudinary.url(file.cloudinary_public_id, {
        resource_type: file.cloudinary_resource_type || 'auto',
        sign_url: true,
        secure: true
    });
    console.log("Signed URL:", signedUrl);
    try {
        await axios.get(signedUrl);
        console.log("Signed fetch SUCCESS");
    } catch (e) {
        console.log("Signed fetch FAILED:", e.response ? e.response.status : e.message);
    }
    
    // Test 3: fl_attachment signed
    const attachUrl = cloudinary.url(file.cloudinary_public_id, {
        resource_type: file.cloudinary_resource_type || 'auto',
        flags: 'attachment',
        sign_url: true,
        secure: true
    });
    console.log("Attach URL:", attachUrl);
    try {
        await axios.get(attachUrl);
        console.log("Attach fetch SUCCESS");
    } catch (e) {
        console.log("Attach fetch FAILED:", e.response ? e.response.status : e.message);
    }

    process.exit(0);
}
test();
