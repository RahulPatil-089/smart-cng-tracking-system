import express from 'express';
import User from '../models/User.js';
import Station from '../models/Station.js';
import Booking from '../models/Booking.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
router.use(protect, authorize('system_admin'));

router.get('/statistics', async (_req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [totalUsers, totalStations, todayBookings, activeBookings, completedBookings, cancelledBookings] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Station.countDocuments(),
      Booking.countDocuments({ bookingDate: today }),
      Booking.countDocuments({ status: { $in: ['Pending', 'Confirmed'] } }),
      Booking.countDocuments({ status: 'Completed' }),
      Booking.countDocuments({ status: 'Cancelled' })
    ]);
    res.json({ stats: { totalUsers, totalStations, todayBookings, activeBookings, completedBookings, cancelledBookings } });
  } catch (error) { next(error); }
});

router.get('/users', async (_req, res, next) => {
  try {
    const users = await User.find().select('-password').populate('stationId', 'name').sort({ createdAt: -1 }).lean();
    res.json({ users });
  } catch (error) { next(error); }
});

router.put('/users/:id/status', async (req, res, next) => {
  try {
    if (typeof req.body.isActive !== 'boolean') return res.status(400).json({ message: 'isActive must be true or false.' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'system_admin') return res.status(400).json({ message: 'System admin accounts cannot be disabled here.' });
    user.isActive = req.body.isActive;
    await user.save();
    const safeUser = await User.findById(user._id).select('-password').populate('stationId', 'name').lean();
    res.json({ user: safeUser });
  } catch (error) { next(error); }
});

router.get('/stations', async (_req, res, next) => {
  try {
    const stations = await Station.find().sort({ createdAt: -1 }).lean();
    res.json({ stations });
  } catch (error) { next(error); }
});

router.put('/stations/:id/approval', async (req, res, next) => {
  try {
    if (typeof req.body.approved !== 'boolean') return res.status(400).json({ message: 'approved must be true or false.' });
    const station = await Station.findByIdAndUpdate(req.params.id, { approved: req.body.approved }, { new: true, runValidators: true });
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    res.json({ station });
  } catch (error) { next(error); }
});

router.put('/stations/:id', async (req, res, next) => {
  try {
    const allowed = ['name', 'address', 'latitude', 'longitude', 'phone', 'openingTime', 'closingTime', 'cngPrice', 'totalPumps', 'totalSlots', 'availableSlots', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const station = await Station.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    res.json({ station });
  } catch (error) { next(error); }
});

router.get('/bookings', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.date) filter.bookingDate = req.query.date;
    const bookings = await Booking.find(filter).populate('userId', 'name email phone').populate('stationId', 'name address').populate('slotId', 'slotNumber').sort({ bookingDate: -1, startTime: 1 }).lean();
    res.json({ bookings });
  } catch (error) { next(error); }
});

router.put('/users/:id/station', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role !== 'station_admin') return res.status(400).json({ message: 'Only station admin accounts can be assigned to a station.' });
    if (!req.body.stationId) return res.status(400).json({ message: 'stationId is required.' });
    const station = await Station.findById(req.body.stationId);
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    user.stationId = station._id;
    await user.save();
    res.json({ user: await User.findById(user._id).select('-password').populate('stationId', 'name').lean() });
  } catch (error) { next(error); }
});

export default router;
