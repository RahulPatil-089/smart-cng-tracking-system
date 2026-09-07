import express from 'express';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import Station from '../models/Station.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const ACTIVE = ['Pending', 'Confirmed'];

router.get('/slots/:stationId', protect, async (req, res) => {
  try {
    const station = await Station.findOne({ _id: req.params.stationId, approved: true }).lean();
    if (!station) return res.status(404).json({ message: 'Station not found' });
    const existing = await Slot.find({ stationId: station._id }).sort({ slotNumber: 1 }).lean();
    if (existing.length < station.totalSlots) {
      const numbers = new Set(existing.map(s => s.slotNumber));
      const missing = [];
      for (let n = 1; n <= station.totalSlots; n += 1) if (!numbers.has(n)) missing.push({ stationId: station._id, slotNumber: n });
      if (missing.length) await Slot.insertMany(missing, { ordered: false });
    }
    const slots = await Slot.find({ stationId: station._id }).sort({ slotNumber: 1 }).lean();
    res.json({ slots });
  } catch (error) { res.status(400).json({ message: 'Unable to load slots', error: error.message }); }
});

router.post('/', protect, async (req, res) => {
  let reservedSlotId = null;
  try {
    const { stationId, slotId, bookingDate, startTime, endTime } = req.body;
    if (!stationId || !slotId || !bookingDate || !startTime || !endTime) return res.status(400).json({ message: 'Station, slot, date and time are required' });
    const today = new Date().toISOString().slice(0, 10);
    if (bookingDate < today) return res.status(400).json({ message: 'Booking date cannot be in the past' });

    const station = await Station.findOne({ _id: stationId, approved: true });
    if (!station) return res.status(404).json({ message: 'Station not found' });
    if (station.status === 'Closed' || station.availableSlots < 1) return res.status(409).json({ message: 'Station is currently unavailable' });

    const duplicate = await Booking.findOne({ slotId, bookingDate, startTime, status: { $in: ACTIVE } });
    if (duplicate) return res.status(409).json({ message: 'That slot is already booked for this time' });

    const slot = await Slot.findOne({ _id: slotId, stationId, status: 'Available' });
    if (!slot) return res.status(409).json({ message: 'Selected pump slot is not available' });

    const bookingId = `CNG-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const qrPayload = JSON.stringify({ bookingId, stationId, slotId, bookingDate, startTime });
    const qrCode = await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 });

    const booking = await Booking.create({ bookingId, userId: req.user._id, stationId, slotId, vehicleNumber: req.user.vehicleNumber, bookingDate, startTime, endTime, status: 'Confirmed', qrCode });
    reservedSlotId = slot._id;
    await Slot.updateOne({ _id: slot._id, status: 'Available' }, { $set: { status: 'Reserved', currentBookingId: booking._id } });
    await Station.updateOne({ _id: stationId }, { $inc: { availableSlots: -1 } });
    res.status(201).json({ booking });
  } catch (error) {
    if (reservedSlotId) await Slot.updateOne({ _id: reservedSlotId, currentBookingId: reservedSlotId }, { $set: { status: 'Available', currentBookingId: null } }).catch(() => {});
    res.status(400).json({ message: 'Booking failed', error: error.message });
  }
});

router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user._id }).populate('stationId', 'name address phone cngPrice latitude longitude').populate('slotId', 'slotNumber').sort({ bookingDate: -1, startTime: -1 }).lean();
    res.json({ bookings });
  } catch (error) { res.status(500).json({ message: 'Unable to load bookings', error: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ $or: [{ _id: req.params.id }, { bookingId: req.params.id }], userId: req.user._id }).populate('stationId').populate('slotId').lean();
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    res.json({ booking });
  } catch { res.status(404).json({ message: 'Booking not found' }); }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ $or: [{ _id: req.params.id }, { bookingId: req.params.id }], userId: req.user._id, status: { $in: ACTIVE } });
    if (!booking) return res.status(404).json({ message: 'Active booking not found' });
    booking.status = 'Cancelled'; await booking.save();
    await Slot.updateOne({ _id: booking.slotId, currentBookingId: booking._id }, { $set: { status: 'Available', currentBookingId: null } });
    await Station.updateOne({ _id: booking.stationId }, { $inc: { availableSlots: 1 } });
    res.json({ booking });
  } catch (error) { res.status(400).json({ message: 'Cancellation failed', error: error.message }); }
});

router.put('/:id/complete', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ $or: [{ _id: req.params.id }, { bookingId: req.params.id }], userId: req.user._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    booking.status = 'Completed'; await booking.save();
    await Slot.updateOne({ _id: booking.slotId, currentBookingId: booking._id }, { $set: { status: 'Available', currentBookingId: null } });
    await Station.updateOne({ _id: booking.stationId }, { $inc: { availableSlots: 1 } });
    res.json({ booking });
  } catch (error) { res.status(400).json({ message: 'Completion failed', error: error.message }); }
});

export default router;
