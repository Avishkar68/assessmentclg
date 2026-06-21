const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const config = require('../config');

const { cloudName, apiKey, apiSecret } = config.cloudinary;
const isCloudinaryConfigured = cloudName && apiKey && apiSecret && 
                               cloudName !== 'your_cloud_name' && 
                               cloudName.trim() !== '';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

/**
 * Uploads a file buffer to Cloudinary (or falls back to local server storage if Cloudinary is not configured)
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} mimeType - The file's MIME type
 * @returns {Promise<string>} The uploaded image secure URL
 */
const uploadImage = async (fileBuffer, mimeType) => {
  if (!isCloudinaryConfigured) {
    // Fallback to local server uploads
    const uploadsDir = path.join(__dirname, '../../public/uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const ext = mimeType.split('/')[1] || 'png';
    const filename = `img_${Date.now()}_${Math.round(Math.random() * 1e9)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, fileBuffer);
    return `http://localhost:${config.port}/public/uploads/${filename}`;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'question-images',
        resource_type: 'image'
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = {
  uploadImage
};
