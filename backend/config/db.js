const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not defined');
  }

  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => mongooseInstance);
  }

  try {
    cached.conn = await cached.promise;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`MongoDB connected: ${cached.conn.connection.host}`);
    }
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
};

module.exports = connectDB;
