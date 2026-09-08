import express from 'express';
import mongoose from 'mongoose';
import Station from '../models/Station.js';
import Slot from '../models/Slot.js';
import Booking from '../models/Booking.js';
import Queue from '../models/Queue.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('station_admin', 'system_admin'));

async function getStation(req) {
  if (req.user.role === 'system_admin' && req.query.stationId) return Station.findById(req.query.stationId);
  if (req.user.stationId) return Station.findById(req.user.stationId);
  return null;
}

function bookingLookup(id, stationId) {
  const idFilter = mongoose.isValidObjectId(id)
    ? { $or: [{ _id: id }, { bookingId: id }] }
    : { bookingId: id };
  return { ...idFilter, stationId };
}

router.get('/dashboard', async (req, res, next) => {
  try {
    const station = await getStation(req);
    if (!station) return res.status(400).json({ message: 'No station is assigned to this admin account.' });
    const today = new Date().toISOString().slice(0, 10);
    const [todayBookings, completed, cancelled, queue, slots] = await Promise.all([
      Booking.find({ stationId: station._id, bookingDate: today }).populate('userId', 'name phone').populate('slotId', 'slotNumber').sort({ startTime: 1 }).lean(),
      Booking.countDocuments({ stationId: station._id, bookingDate: today, status: 'Completed' }),
      Booking.countDocuments({ stationId: station._id, bookingDate: today, status: 'Cancelled' }),
      Queue.find({ stationId: station._id, status: { $in: ['Waiting', 'Refueling'] } }).populate('userId', 'name phone').sort({ position: 1 }).lean(),
      Slot.find({ stationId: station._id }).sort({ slotNumber: 1 }).lean()
    ]);
    res.json({ station, stats: { todayBookings: todayBookings.length, completed, cancelled, queue: queue.filter(q => q.status === 'Waiting').length }, bookings: todayBookings, queue, slots });
  } catch (error) { next(error); }
});

router.get('/analytics', async (req, res, next) => {
  try {
    const station = await getStation(req);
    if (!station) return res.status(400).json({ message: 'No station is assigned to this admin account.' });
    const days = Math.min(Math.max(Number.parseInt(req.query.days || '7', 10) || 7, 1), 31);
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    from.setDate(from.getDate() - (days - 1));
    const fromDate = from.toISOString().slice(0, 10);
    const bookings = await Booking.find({ stationId: station._id, bookingDate: { $gte: fromDate } }).select('bookingDate startTime status').lean();
    const dailyMap = new Map();
    for (let i = 0; i < days; i += 1) {
      const date = new Date(from);
      date.setDate(from.getDate() + i);
      dailyMap.set(date.toISOString().slice(0, 10), { date: date.toISOString().slice(0, 10), total: 0, completed: 0, cancelled: 0 });
    }
    const peakHours = {};
    for (const booking of bookings) {
      const day = dailyMap.get(booking.bookingDate);
      if (day) {
        day.total += 1;
        if (booking.status === 'Completed') day.completed += 1;
        if (booking.status === 'Cancelled') day.cancelled += 1;
      }
      const hour = String(booking.startTime || '').slice(0, 2);
      if (/^\d{2}$/.test(hour)) peakHours[hour] = (peakHours[hour] || 0) + 1;
    }
    const peakHoursList = Object.entries(peakHours).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([hour, count]) => ({ hour: `${hour}:00`, count }));
    res.json({ days, daily: [...dailyMap.values()], peakHours: peakHoursList });
  } catch (error) { next(error); }
});

router.get('/bookings/verify/:bookingId', async (req, res, next) => {
  try {
    const station = await getStation(req);
    if (!station) return res.status(400).json({ message: 'No station is assigned to this admin account.' });
    const booking = await Booking.findOne({ bookingId: req.params.bookingId.trim().toUpperCase(), stationId: station._id })
      .populate('userId', 'name email phone vehicleNumber vehicleType')
      .populate('slotId', 'slotNumber status')
      .populate('stationId', 'name address phone');
    if (!booking) return res.status(404).json({ message: 'Booking not found for this station.' });
    res.json({ booking });
  } catch (error) { next(error); }
});

router.put('/slots/:id', async (req, res, next) => {
  try {
    const station = await getStation(req);
    if (!station) return res.status(400).json({ message: 'No station is assigned to this admin account.' });
    const slot = await Slot.findOne({ _id: req.params.id, stationId: station._id });
    if (!slot) return res.status(404).json({ message: 'Slot not found for this station.' });
    if (!['Available', 'Occupied', 'Reserved', 'Maintenance'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid slot status.' });
    if (req.body.status === 'Maintenance' && slot.currentBookingId) return res.status(409).json({ message: 'This pump has an active booking and cannot be put into maintenance.' });
    slot.status = req.body.status;
    await slot.save();
    res.json({ slot });
  } catch (error) { next(error); }
});

router.put('/bookings/:id/status', async (req, res, next) => {
  try {
    const station = await getStation(req);
    if (!station) return res.status(400).json({ message: 'No station is assigned to this admin account.' });
    const booking = await Booking.findOne(bookingLookup(req.params.id, station._id));
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!['Confirmed', 'Completed', 'Cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid booking status.' });
    booking.status = req.body.status;
    await booking.save();
    res.json({ booking });
  } catch (error) { next(error); }
});

export default router;
