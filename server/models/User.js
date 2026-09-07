import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
    vehicleType: { type: String, required: true, trim: true },
    role: { type: String, enum: ['user', 'station_admin', 'system_admin'], default: 'user' },
    stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', default: null, index: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
