import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true, min: -90, max: 90 },
  longitude: { type: Number, required: true, min: -180, max: 180 },
  phone: { type: String, required: true, trim: true },
  openingTime: { type: String, required: true },
  closingTime: { type: String, required: true },
  cngPrice: { type: Number, required: true, min: 0 },
  totalPumps: { type: Number, required: true, min: 1 },
  totalSlots: { type: Number, required: true, min: 1 },
  availableSlots: { type: Number, required: true, min: 0 },
  queueLength: { type: Number, default: 0, min: 0 },
  averageServiceMinutes: { type: Number, default: 8, min: 1 },
  status: { type: String, enum: ['Open', 'Closed', 'Busy', 'Available'], default: 'Available' },
  approved: { type: Boolean, default: true }
}, { timestamps: true });

stationSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model('Station', stationSchema);
