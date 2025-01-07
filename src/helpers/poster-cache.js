const fs = require('fs').promises;
const path = require('path');
const log = require('./logger');

const CACHE_DIR = path.join(__dirname, '../../db/ratedPosters');
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Ensure cache directory exists
(async () => {
    try {
        await fs.mkdir(CACHE_DIR, { recursive: true });
        log.info('Rated posters cache directory initialized');
    } catch (error) {
        log.error(`Error creating rated posters cache directory: ${error.message}`);
    }
})();

/**
 * Clean expired cache files
 */
const cleanExpiredCache = async () => {
    try {
        const files = await fs.readdir(CACHE_DIR);
        const now = Date.now();

        for (const file of files) {
            const filePath = path.join(CACHE_DIR, file);
            const stats = await fs.stat(filePath);

            if (now - stats.mtimeMs > CACHE_DURATION) {
                await fs.unlink(filePath);
                log.debug(`Removed expired cache file: ${file}`);
            }
        }
    } catch (error) {
        log.error(`Error cleaning expired cache: ${error.message}`);
    }
};

// Run cache cleanup every 24 hours
setInterval(cleanExpiredCache, 24 * 60 * 60 * 1000);

/**
 * Get cached poster path if it exists and is valid
 */
const getCachedPoster = async (contentId) => {
    const cacheKey = `rated-poster-${contentId}`;
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);

    try {
        const stats = await fs.stat(cachePath);
        
        if (Date.now() - stats.mtimeMs < CACHE_DURATION) {
            return cachePath;
        }
        
        // Cache expired, remove it
        await fs.unlink(cachePath);
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Save poster to cache
 */
const savePosterToCache = async (contentId, imageBuffer) => {
    const cacheKey = `rated-poster-${contentId}`;
    const cachePath = path.join(CACHE_DIR, `${cacheKey}.jpg`);

    try {
        await fs.writeFile(cachePath, imageBuffer);
        log.debug(`Saved rated poster to cache: ${cacheKey}`);
        return true;
    } catch (error) {
        log.error(`Error saving poster to cache: ${error.message}`);
        return false;
    }
};

/**
 * Get cache file path
 */
const getCacheFilePath = (contentId) => {
    return path.join(CACHE_DIR, `rated-poster-${contentId}.jpg`);
};

module.exports = {
    CACHE_DIR,
    CACHE_DURATION,
    getCachedPoster,
    savePosterToCache,
    getCacheFilePath,
    cleanExpiredCache
};