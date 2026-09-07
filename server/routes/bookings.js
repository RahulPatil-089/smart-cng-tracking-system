import express from 'express';
import crypto from 'node:crypto';
import QRCode from 'qrcode';
import Station from '../models/Station.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
const ACTIVE = ['Pending', 'Confirmed'];
const CANCELLATION_MINUTES = 15;

function localDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

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
    const date = req.query.date;
    const bookings = date ? await Booking.find({ stationId: station._id, bookingDate: date, status: { $in: ACTIVE } }).select('slotId startTime endTime').lean() : [];
    const slots = await Slot.find({ stationId: station._id }).sort({ slotNumber: 1 }).lean();
    res.json({ slots: slots.map(slot => ({ ...slot, bookings: bookings.filter(b => String(b.slotId) === String(slot._id)) })) });
  } catch (error) { res.status(400).json({ message: 'Unable to load slots', error: error.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { stationId, slotId, bookingDate, startTime, endTime } = req.body;
    if (!stationId || !slotId || !bookingDate || !startTime || !endTime) return res.status(400).json({ message: 'Station, slot, date and time are required' });
    const today = localDateString();
    if (bookingDate < today) return res.status(400).json({ message: 'Booking date cannot be in the past' });
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) return res.status(400).json({ message: 'Invalid booking time' });
    if (startTime >= endTime) return res.status(400).json({ message: 'End time must be after start time' });
    if (bookingDate === today && new Date(`${bookingDate}T${startTime}:00`).getTime() <= Date.now()) return res.status(400).json({ message: 'The selected time has already passed. Choose a future slot.' });

    const station = await Station.findOne({ _id: stationId, approved: true });
    if (!station) return res.status(404).json({ message: 'Station not found' });
    if (station.status === 'Closed') return res.status(409).json({ message: 'Station is currently closed' });
    if (startTime < station.openingTime || endTime > station.closingTime) return res.status(400).json({ message: `Booking must be within station hours (${station.openingTime}–${station.closingTime})` });

    const slot = await Slot.findOne({ _id: slotId, stationId });
    if (!slot) return res.status(404).json({ message: 'Invalid station slot' });
    if (slot.status !== 'Available') return res.status(409).json({ message: `Pump ${slot.slotNumber} is currently ${slot.status.toLowerCase()}` });

    const overlap = { $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }] };
    const duplicate = await Booking.findOne({ slotId, bookingDate, status: { $in: ACTIVE }, ...overlap });
    if (duplicate) return res.status(409).json({ message: 'That pump is already booked for the selected time' });
    const userOverlap = await Booking.findOne({ userId: req.user._id, bookingDate, status: { $in: ACTIVE }, ...overlap });
    if (userOverlap) return res.status(409).json({ message: 'You already have an overlapping booking on this date' });

    const bookingId = `CNG-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const qrPayload = JSON.stringify({ bookingId, stationId, slotId, bookingDate, startTime });
    const qrCode = await QRCode.toDataURL(qrPayload, { margin: 1, width: 240 });
    const booking = await Booking.create({ bookingId, userId: req.user._id, stationId, slotId, vehicleNumber: req.user.vehicleNumber, bookingDate, startTime, endTime, status: 'Confirmed', qrCode });
    res.status(201).json({ booking });
  } catch (error) { res.status(400).json({ message: 'Booking failed', error: error.message }); }
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
    if (isCancellationClosed(booking)) return res.status(409).json({ message: `Cancellation closes ${CANCELLATION_MINUTES} minutes before the booking starts.` });
    booking.status = 'Cancelled'; await booking.save();
    res.json({ booking });
  } catch (error) { res.status(400).json({ message: 'Cancellation failed', error: error.message }); }
});

router.put('/:id/complete', protect, async (req, res) => {
  try {
    const booking = await Booking.findOne({ $or: [{ _id: req.params.id }, { bookingId: req.params.id }], userId: req.user._id, status: { $in: ACTIVE } });
    if (!booking) return res.status(404).json({ message: 'Active booking not found' });
    booking.status = 'Completed'; await booking.save();
    res.json({ booking });
  } catch (error) { res.status(400).json({ message: 'Completion failed', error: error.message }); }
});

function isCancellationClosed(booking) {
  const start = new Date(`${booking.bookingDate}T${booking.startTime}:00`);
  return start.getTime() - Date.now() <= CANCELLATION_MINUTES * 60 * 1000;
}

export default router;
