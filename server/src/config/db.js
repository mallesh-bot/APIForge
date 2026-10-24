import dns from 'dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDB() {
  try {
    if (env.MONGODB_URI.startsWith('mongodb+srv://')) {
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch {
        // Continue with default DNS if setServers is restricted
      }
    }
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.error('');
    console.error('Troubleshooting tips:');
    console.error('  • If using local MongoDB, ensure mongod is running:');
    console.error('      mongod --dbpath /data/db');
    console.error('  • If using MongoDB Atlas, check your connection string and network access.');
    console.error('  • Verify MONGODB_URI in your .env file.');
    console.error('');
    process.exit(1);
  }
}
