import dotenv from 'dotenv';
dotenv.config({ path: new URL('./.env', import.meta.url) });

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import stationRoutes from './routes/stations.js';
import bookingRoutes from './routes/bookings.js';
import queueRoutes from './routes/queue.js';
import adminRoutes from './routes/admin.js';
import systemAdminRoutes from './routes/systemAdmin.js';
import Booking from './models/Booking.js';
import { stationDateString } from './utils/stationTime.js';

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'smart-cng-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system-admin', systemAdminRoutes);
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err?.name === 'ValidationError') return res.status(400).json({ message: 'Invalid request data.' });
  if (err?.code === 11000) return res.status(409).json({ message: 'This booking or queue entry already exists.' });
  res.status(500).json({ message: 'Internal server error' });
});

async function expireUnvisitedBookings() {
  const today = stationDateString();
  const result = await Booking.updateMany(
    { bookingDate: { $lt: today }, status: { $in: ['Pending', 'Confirmed'] } },
    { $set: { status: 'Unvisited' } }
  );
  if (result.modifiedCount) console.log(`Marked ${result.modifiedCount} missed booking(s) as Unvisited.`);
}

async function start() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    await expireUnvisitedBookings();
    const expiryTimer = setInterval(() => expireUnvisitedBookings().catch(error => console.error('Booking expiry failed:', error.message)), 60 * 1000);
    expiryTimer.unref();
    app.listen(port, () => console.log(`Smart CNG API running on http://localhost:${port}`));
  } catch (error) { console.error(`Server startup failed: ${error.message}`); process.exit(1); }
}
start();
