// config/db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB connecté sur : ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error("❌ DB connection failed", err);
    process.exit(1);
  }
};



export default connectDB;
