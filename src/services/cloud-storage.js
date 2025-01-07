const cloudinary = require('cloudinary').v2;
const log = require('../helpers/logger');

// Configure Cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudStorage {
    constructor() {
        this.folder = 'rated-posters'; // Cloudinary folder to store posters
    }

    async uploadPoster(buffer, contentId) {
        try {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({
                    folder: this.folder,
                    public_id: contentId,
                    resource_type: 'image',
                }, (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }).end(buffer);
            });

            log.debug(`Uploaded poster to Cloudinary: ${contentId}`);
            return result.secure_url;
        } catch (error) {
            log.error(`Error uploading to Cloudinary: ${error.message}`);
            throw error;
        }
    }

    async getPosterUrl(contentId) {
        try {
            const result = await cloudinary.search
                .expression(`folder:${this.folder} AND public_id:${contentId}`)
                .execute();

            if (result.resources.length > 0) {
                return result.resources[0].secure_url;
            }
            return null;
        } catch (error) {
            log.error(`Error getting poster URL from Cloudinary: ${error.message}`);
            return null;
        }
    }

    async deletePoster(contentId) {
        try {
            await cloudinary.uploader.destroy(`${this.folder}/${contentId}`);
            log.debug(`Deleted poster from Cloudinary: ${contentId}`);
            return true;
        } catch (error) {
            log.error(`Error deleting from Cloudinary: ${error.message}`);
            return false;
        }
    }
}

module.exports = new CloudStorage();