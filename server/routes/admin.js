import express from 'express';
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

router.put('/slots/:id', async (req, res, next) => {
  try {
    const station = await getStation(req);
    const slot = await Slot.findOne({ _id: req.params.id, stationId: station?._id });
    if (!slot) return res.status(404).json({ message: 'Slot not found for this station.' });
    if (!['Available', 'Occupied', 'Reserved'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid slot status.' });
    slot.status = req.body.status;
    await slot.save();
    res.json({ slot });
  } catch (error) { next(error); }
});

router.put('/bookings/:id/status', async (req, res, next) => {
  try {
    const station = await getStation(req);
    const booking = await Booking.findOne({ $or: [{ _id: req.params.id }, { bookingId: req.params.id }], stationId: station?._id });
    if (!booking) return res.status(404).json({ message: 'Booking not found.' });
    if (!['Confirmed', 'Completed', 'Cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid booking status.' });
    const oldStatus = booking.status;
    booking.status = req.body.status;
    await booking.save();
    if (oldStatus !== 'Cancelled' && req.body.status === 'Cancelled') await Station.updateOne({ _id: station._id }, { $inc: { availableSlots: 1 } });
    if (oldStatus === 'Cancelled' && req.body.status !== 'Cancelled') await Station.updateOne({ _id: station._id, availableSlots: { $gt: 0 } }, { $inc: { availableSlots: -1 } });
    res.json({ booking });
  } catch (error) { next(error); }
});

export default router;
