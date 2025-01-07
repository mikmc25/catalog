const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const log = require('../helpers/logger');

const POSTER_WIDTH = 500;
const POSTER_HEIGHT = 750;

const getRatingColor = (rating) => {
    if (rating >= 8) return '#22c55e'; // green-500
    if (rating >= 6) return '#eab308'; // yellow-500
    if (rating >= 4) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
};

/**
 * Download image from URL
 */
const downloadImage = async (url) => {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        log.error(`Error downloading image from ${url}: ${error.message}`);
        throw new Error('Failed to download poster image');
    }
};

/**
 * Create a poster with rating overlay
 */
const createRatedPoster = async (imageBuffer, rating) => {
    try {
        // Create canvas with poster dimensions
        const canvas = createCanvas(POSTER_WIDTH, POSTER_HEIGHT);
        const ctx = canvas.getContext('2d');

        // Load and draw the poster image
        const image = await loadImage(imageBuffer);
        ctx.drawImage(image, 0, 0, POSTER_WIDTH, POSTER_HEIGHT);

        // Add semi-transparent dark gradient at the top for better rating visibility
        const gradient = ctx.createLinearGradient(0, 0, 0, 80);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, POSTER_WIDTH, 80);

        // Draw rating badge
        ctx.fillStyle = getRatingColor(rating);
        ctx.beginPath();
        ctx.roundRect(POSTER_WIDTH - 80, 20, 60, 30, 5);
        ctx.fill();

        // Add slight shadow to the badge
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Draw rating text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rating.toFixed(1), POSTER_WIDTH - 50, 35);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Return the buffer
        return canvas.toBuffer('image/jpeg', { quality: 0.9 });
    } catch (error) {
        log.error(`Error creating rated poster: ${error.message}`);
        throw new Error('Failed to create rated poster');
    }
};

/**
 * Process poster with rating
 */
const processRatedPoster = async (posterUrl, rating) => {
    try {
        const imageBuffer = await downloadImage(posterUrl);
        return await createRatedPoster(imageBuffer, rating);
    } catch (error) {
        log.error(`Error processing rated poster: ${error.message}`);
        throw error;
    }
};

module.exports = {
    processRatedPoster,
    POSTER_WIDTH,
    POSTER_HEIGHT
};