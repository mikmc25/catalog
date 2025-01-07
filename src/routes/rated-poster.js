const express = require('express');
const router = express.Router();
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const cloudStorage = require('../services/cloud-storage');
const log = require('../helpers/logger');

// Fixed total dimensions to match Stremio's requirements
const POSTER_WIDTH = 500;
const TOTAL_HEIGHT = 750;
const RATING_HEIGHT = 60;  // Height for rating area
const POSTER_HEIGHT = TOTAL_HEIGHT - RATING_HEIGHT; // Remaining height for poster

// Badge dimensions - doubled from previous
const BADGE_WIDTH = 240;
const BADGE_HEIGHT = 50;
const FONT_SIZE = 64;  // Doubled font size

const getRatingColor = (rating) => {
    if (rating >= 8) return '#22c55e';
    if (rating >= 6) return '#eab308';
    if (rating >= 4) return '#f97316';
    return '#ef4444';
};

async function createRatedPoster(imageBuffer, rating) {
    const canvas = createCanvas(POSTER_WIDTH, TOTAL_HEIGHT);
    const ctx = canvas.getContext('2d');

    try {
        // Fill background with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, POSTER_WIDTH, TOTAL_HEIGHT);

        // Load and draw the image
        const image = await loadImage(imageBuffer);
        ctx.drawImage(image, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

        if (rating && rating !== 'NR') {
            // Format rating to one decimal place
            const formattedRating = parseFloat(rating).toFixed(1);

            // Draw rating badge in center below poster
            ctx.fillStyle = getRatingColor(parseFloat(formattedRating));
            const badgeX = (POSTER_WIDTH - BADGE_WIDTH) / 2;
            const badgeY = POSTER_HEIGHT + (RATING_HEIGHT - BADGE_HEIGHT) / 2;
            
            // Add glow effect
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 15;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 3;

            // Draw badge background with rounded corners
            ctx.beginPath();
            const radius = 10;
            ctx.roundRect(badgeX, badgeY, BADGE_WIDTH, BADGE_HEIGHT, radius);
            ctx.fill();

            // Reset shadow for text
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Draw rating text
            ctx.fillStyle = 'white';
            ctx.font = `bold ${FONT_SIZE}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Calculate center of badge
            const textX = POSTER_WIDTH / 2;
            const textY = POSTER_HEIGHT + RATING_HEIGHT / 2;

            // Add star emoji to rating with one decimal place
            ctx.fillText(`${formattedRating}★`, textX, textY);
        }

        return canvas.toBuffer('image/jpeg', { quality: 0.95 });
    } catch (error) {
        log.error(`Error creating rated poster: ${error.message}`);
        throw error;
    }
}

// Create and cache a rated poster
router.post('/cache-rated-poster', async (req, res) => {
    const { posterUrl, rating, contentId } = req.body;

    if (!posterUrl || !contentId) {
        return res.status(400).json({ error: 'Missing required parameters' });
    }

    try {
        // Check if poster already exists in cloud storage
        const existingUrl = await cloudStorage.getPosterUrl(contentId);
        if (existingUrl) {
            return res.json({ 
                success: true, 
                message: 'Poster already cached',
                url: existingUrl
            });
        }

        // Download the original poster
        const response = await axios.get(posterUrl, { 
            responseType: 'arraybuffer',
            timeout: 5000
        });

        // Create the rated poster
        const ratedPosterBuffer = await createRatedPoster(response.data, rating);
        
        // Upload to cloud storage
        const cloudUrl = await cloudStorage.uploadPoster(ratedPosterBuffer, contentId);
        
        log.debug(`Created and uploaded rated poster for ${contentId}`);
        res.json({ 
            success: true, 
            message: 'Poster created and cached',
            url: cloudUrl
        });
    } catch (error) {
        log.error(`Error creating rated poster: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to create rated poster',
            message: error.message 
        });
    }
});

// Get poster directly from cloud storage
router.get('/rated-poster/:contentId', async (req, res) => {
    const { contentId } = req.params;

    try {
        const cloudUrl = await cloudStorage.getPosterUrl(contentId);
        if (cloudUrl) {
            res.redirect(cloudUrl);
        } else {
            log.error(`Poster not found in cloud storage: ${contentId}`);
            res.status(404).json({
                error: 'Poster not found',
                message: `No poster found for ${contentId}`
            });
        }
    } catch (error) {
        log.error(`Error retrieving poster from cloud storage: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to retrieve poster',
            message: error.message 
        });
    }
});

// Delete a poster from cloud storage (optional cleanup endpoint)
router.delete('/rated-poster/:contentId', async (req, res) => {
    const { contentId } = req.params;

    try {
        const deleted = await cloudStorage.deletePoster(contentId);
        if (deleted) {
            res.json({ success: true, message: 'Poster deleted successfully' });
        } else {
            res.status(404).json({ error: 'Poster not found' });
        }
    } catch (error) {
        log.error(`Error deleting poster from cloud storage: ${error.message}`);
        res.status(500).json({ 
            error: 'Failed to delete poster',
            message: error.message 
        });
    }
});

module.exports = router;