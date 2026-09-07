import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Station from './models/Station.js';
import Slot from './models/Slot.js';

const required = ['MONGODB_URI', 'SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD', 'SEED_STATION_ADMIN_EMAIL', 'SEED_STATION_ADMIN_PASSWORD'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required to run the seed.`);
}

const adminEmail = process.env.SEED_ADMIN_EMAIL.trim().toLowerCase();
const stationAdminEmail = process.env.SEED_STATION_ADMIN_EMAIL.trim().toLowerCase();

async function upsertUser({ email, password, defaults }) {
  const hash = await bcrypt.hash(password, 12);
  return User.findOneAndUpdate(
    { email },
    { $set: defaults, $setOnInsert: { password: hash } },
    { new: true, upsert: true, runValidators: true }
  );
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  const station = await Station.findOneAndUpdate(
    { name: 'Smart CNG Demo Station' },
    {
      $set: {
        address: 'Nashik, Maharashtra', latitude: 19.9975, longitude: 73.7898,
        phone: '0253-0000000', openingTime: '06:00', closingTime: '22:00', cngPrice: 92,
        totalPumps: 4, totalSlots: 4, availableSlots: 4, status: 'Available', approved: true,
        averageServiceMinutes: 8
      }
    },
    { new: true, upsert: true, runValidators: true }
  );

  for (let number = 1; number <= station.totalSlots; number += 1) {
    await Slot.findOneAndUpdate(
      { stationId: station._id, slotNumber: number },
      { $setOnInsert: { stationId: station._id, slotNumber: number, status: 'Available' } },
      { upsert: true, new: true }
    );
  }

  await upsertUser({
    email: adminEmail,
    password: process.env.SEED_ADMIN_PASSWORD,
    defaults: { name: 'System Administrator', phone: '0000000000', vehicleNumber: 'ADMIN-001', vehicleType: 'Admin', role: 'system_admin', stationId: null, isActive: true }
  });

  await upsertUser({
    email: stationAdminEmail,
    password: process.env.SEED_STATION_ADMIN_PASSWORD,
    defaults: { name: 'Station Administrator', phone: '0000000001', vehicleNumber: 'ADMIN-002', vehicleType: 'Admin', role: 'station_admin', stationId: station._id, isActive: true }
  });

  console.log(`Seed complete. Demo station: ${station._id}`);
}

seed().catch((error) => {
  console.error(`Seed failed: ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
