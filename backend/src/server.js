const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

let server;

// Start server first, then connect to MongoDB in the background
server = app.listen(config.port, () => {
  console.log(`Server is running in ${config.env} mode on port ${config.port}`);
  connectDB();
});

// Graceful shutdown handling
const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed gracefully');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('Unhandled Exception or Promise Rejection:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.info('SIGTERM received. Shutting down gracefully.');
  if (server) {
    server.close(() => {
      console.log('Server closed');
    });
  }
});
