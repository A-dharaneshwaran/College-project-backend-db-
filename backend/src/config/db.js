const mongoose = require('mongoose');
const config = require('./index');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required.");
  }

  try {
    const conn = await mongoose.connect(config.mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }

  // Connection event listeners
  mongoose.connection.on('connected', () => {
    console.log('📡 Mongoose connected to DB');
  });

  mongoose.connection.on('error', (err) => {
    console.error(`📡 Mongoose connection error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('📡 Mongoose disconnected from DB');
  });
};

// Graceful shutdown helper
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📡 MongoDB connection closed through app termination');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error.message);
  }
};

module.exports = { connectDB, disconnectDB };
