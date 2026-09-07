import 'dotenv/config';
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

const app = express();
const port = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'smart-cng-api' }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api', queueRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/system-admin', systemAdminRoutes);
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ message: 'Internal server error' }); });

async function start() {
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
    if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');
    app.listen(port, () => console.log(`Smart CNG API running on http://localhost:${port}`));
  } catch (error) { console.error(`Server startup failed: ${error.message}`); process.exit(1); }
}
start();
