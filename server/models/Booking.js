import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, required: true, unique: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
  bookingDate: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Expired'], default: 'Confirmed', index: true },
  qrCode: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

bookingSchema.index({ slotId: 1, bookingDate: 1, startTime: 1, status: 1 });
export default mongoose.model('Booking', bookingSchema);
