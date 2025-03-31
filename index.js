require('dotenv').config();
const express = require('express');
const cors = require('cors');

const path = require('path');
const log = require('./src/helpers/logger');
const { pool } = require('./src/helpers/db');
const routes = require('./src/routes/index');

const PORT = process.env.PORT || 7000;
const app = express();

// Initialization function
const initializeApp = async () => {
    try {
        // Test database connection
        const client = await pool.connect();
        log.info('Database connection successful');
        client.release();

        // Basic middleware
        app.use(cors());
        app.use(express.static(path.join(__dirname, 'public')));
        app.use(express.json());

        // Routes
        app.use('/', routes);

        // Start server
        app.listen(PORT, () => {
            log.info(`Server running on port ${PORT} - Environment: ${process.env.NODE_ENV || 'development'}`);
        });

    } catch (error) {
        log.error('Failed to initialize application:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the application
initializeApp().catch(error => {
    log.error('Failed to start application:', error);
    process.exit(1);
});
