const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const path = require('path');

const app = express();

// Configure CORS to allow all origins
app.use(cors());

// Serve static assets
app.use('/public', express.static(path.join(__dirname, '../public')));

// Parse incoming request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route handlers
app.use('/api', routes);

// Catch-all route for 404 Errors
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
