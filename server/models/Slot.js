import mongoose from 'mongoose';

const slotSchema = new mongoose.Schema({
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true, index: true },
  slotNumber: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'], default: 'Available' },
  currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null }
}, { timestamps: true });

slotSchema.index({ stationId: 1, slotNumber: 1 }, { unique: true });
export default mongoose.model('Slot', slotSchema);
