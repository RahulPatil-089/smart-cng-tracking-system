import mongoose from 'mongoose';

const queueSchema = new mongoose.Schema({
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  position: { type: Number, required: true, min: 1 },
  estimatedWaitTime: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Waiting', 'Refueling', 'Completed', 'Cancelled'], default: 'Waiting', index: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

queueSchema.index({ stationId: 1, status: 1, position: 1 });

export default mongoose.model('Queue', queueSchema);
