const mongoose = require('mongoose');

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retries = MAX_RETRIES) => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // fail fast on initial connect attempt
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    // Reconnect automatically if the connection drops after initial connect
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected — attempting reconnect...');
      setTimeout(() => connectDB(MAX_RETRIES), RETRY_DELAY_MS);
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    if (retries > 0) {
      console.log(`   Retrying in ${RETRY_DELAY_MS / 1000}s… (${retries} attempts left)`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retries - 1);
    }

    // All retries exhausted — keep server alive (health check will show DEGRADED)
    console.error('   All MongoDB connection attempts failed. Database features unavailable.');
  }
};

module.exports = connectDB;
