const app = require('./app');
const config = require('./config');
const { connectDB } = require('./config/db');

let server;

// Connect to Database and start server
const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ Error: JWT_SECRET environment variable is required to secure authentication tokens.');
    process.exit(1);
  }
  try {
    await connectDB();
    server = app.listen(config.port, () => {
      console.log(`===========================================================`);
      console.log(`🚀 Server running in ${config.env} mode on port ${config.port}`);
      console.log(`📖 API Documentation available at http://localhost:${config.port}/api-docs`);
      console.log(`===========================================================`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('👋 HTTP server closed');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error('❌ Unexpected error:', error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('⚠️ SIGTERM received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('👋 HTTP server closed');
    });
  }
});

process.on('SIGINT', () => {
  console.log('⚠️ SIGINT received, shutting down gracefully...');
  if (server) {
    server.close(() => {
      console.log('👋 HTTP server closed');
    });
  }
});
