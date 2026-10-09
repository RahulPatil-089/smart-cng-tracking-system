import express from 'express';
import mongoose from 'mongoose';
import Queue from '../models/Queue.js';
import Booking from '../models/Booking.js';
import Station from '../models/Station.js';
import { stationDateString } from '../utils/stationTime.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();
const ACTIVE_BOOKING = ['Pending', 'Confirmed'];


async function refreshStationQueue(stationId) {
  const station = await Station.findById(stationId);
  if (!station) return null;
  const active = await Queue.find({ stationId, status: { $in: ['Waiting', 'Refueling'] } }).sort({ createdAt: 1 });
  const serviceMinutes = station.averageServiceMinutes || 8;
  for (let i = 0; i < active.length; i += 1) {
    active[i].position = i + 1;
    active[i].estimatedWaitTime = i * serviceMinutes;
    await active[i].save();
  }
  station.queueLength = active.filter(q => q.status === 'Waiting').length;
  await station.save();
  return active;
}

async function canManageQueue(req, stationId) {
  if (req.user.role === 'system_admin') return true;
  return req.user.role === 'station_admin' && req.user.stationId?.toString() === stationId.toString();
}

router.get('/stations/:id/queue', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid station ID.' });
    const station = await Station.findById(req.params.id).select('name queueLength averageServiceMinutes');
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    await refreshStationQueue(station._id);
    const queue = await Queue.find({ stationId: station._id, status: { $in: ['Waiting', 'Refueling'] } }).sort({ position: 1 }).populate('userId', 'name');
    res.json({ station, queue });
  } catch (error) { next(error); }
});

router.post('/stations/:id/queue', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid station ID.' });
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    if (!station.approved) return res.status(400).json({ message: 'This station is not approved.' });
    if (station.status === 'Closed') return res.status(400).json({ message: 'This station is closed.' });

    const existing = await Queue.findOne({ stationId: station._id, userId: req.user._id, status: { $in: ['Waiting', 'Refueling'] } });
    if (existing) return res.status(409).json({ message: 'You are already in this station queue.', queue: existing });

    const today = stationDateString();
    let booking = null;
    if (req.body.bookingId) {
      booking = await Booking.findOne({
        $or: [{ bookingId: String(req.body.bookingId).trim().toUpperCase() }, ...(mongoose.isValidObjectId(req.body.bookingId) ? [{ _id: req.body.bookingId }] : [])],
        stationId: station._id, userId: req.user._id, bookingDate: today, status: { $in: ACTIVE_BOOKING }
      });
      if (!booking) return res.status(400).json({ message: 'The booking must belong to you, this station, and today.' });
      const alreadyLinked = await Queue.findOne({ bookingId: booking._id, status: { $ne: 'Cancelled' } });
      if (alreadyLinked) return res.status(409).json({ message: 'This booking already has a queue entry.' });
    } else {
      booking = await Booking.findOne({ stationId: station._id, userId: req.user._id, bookingDate: today, status: { $in: ACTIVE_BOOKING } }).sort({ startTime: 1 });
      if (booking) {
        const alreadyLinked = await Queue.findOne({ bookingId: booking._id, status: { $ne: 'Cancelled' } });
        if (alreadyLinked) booking = null;
      }
    }

    const active = await Queue.countDocuments({ stationId: station._id, status: { $in: ['Waiting', 'Refueling'] } });
    const queue = await Queue.create({
      stationId: station._id, userId: req.user._id, bookingId: booking?._id || null,
      vehicleNumber: req.user.vehicleNumber, position: active + 1,
      estimatedWaitTime: active * (station.averageServiceMinutes || 8)
    });
    await refreshStationQueue(station._id);
    res.status(201).json({ message: 'Joined the queue.', queue });
  } catch (error) { next(error); }
});

router.delete('/queue/:id', protect, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid queue entry ID.' });
    const queue = await Queue.findById(req.params.id);
    if (!queue) return res.status(404).json({ message: 'Queue entry not found.' });
    const isOwner = queue.userId.toString() === req.user._id.toString();
    if (!isOwner && !(await canManageQueue(req, queue.stationId))) return res.status(403).json({ message: 'Not authorized.' });
    if (queue.status === 'Completed') return res.status(409).json({ message: 'Completed refueling cannot be cancelled.' });
    if (queue.status === 'Cancelled') return res.json({ message: 'Queue entry is already cancelled.' });
    queue.status = 'Cancelled';
    await queue.save();
    await refreshStationQueue(queue.stationId);
    res.json({ message: 'Removed from queue.' });
  } catch (error) { next(error); }
});

router.put('/queue/:id/status', protect, authorize('station_admin', 'system_admin'), async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid queue entry ID.' });
    const queue = await Queue.findById(req.params.id);
    if (!queue) return res.status(404).json({ message: 'Queue entry not found.' });
    if (!(await canManageQueue(req, queue.stationId))) return res.status(403).json({ message: 'You can only manage your assigned station queue.' });
    const nextStatus = req.body.status;
    if (!['Waiting', 'Refueling', 'Completed', 'Cancelled'].includes(nextStatus)) return res.status(400).json({ message: 'Invalid queue status.' });
    const allowed = {
      Waiting: ['Refueling', 'Cancelled'],
      Refueling: ['Completed', 'Cancelled'],
      Completed: [],
      Cancelled: []
    };
    if (nextStatus !== queue.status && !allowed[queue.status].includes(nextStatus)) {
      return res.status(409).json({ message: `Invalid queue transition: ${queue.status} → ${nextStatus}.` });
    }
    if (nextStatus === 'Completed') {
      if (queue.status !== 'Refueling') return res.status(409).json({ message: 'Start refueling before marking it completed.' });
      if (queue.bookingId) {
        const booking = await Booking.findOne({ _id: queue.bookingId, stationId: queue.stationId, userId: queue.userId });
        if (!booking) return res.status(409).json({ message: 'Linked booking could not be verified.' });
        if (booking.bookingDate !== stationDateString()) return res.status(409).json({ message: 'Refueling can only complete on the booking date.' });
        if (booking.status === 'Unvisited' || booking.status === 'Cancelled' || booking.status === 'Expired') {
          return res.status(409).json({ message: `A ${booking.status.toLowerCase()} booking cannot be completed.` });
        }
        if (booking.status !== 'Completed') {
          booking.status = 'Completed';
          await booking.save();
        }
      }
    }
    queue.status = nextStatus;
    await queue.save();
    const activeQueue = await refreshStationQueue(queue.stationId);
    res.json({ message: 'Queue status updated.', queue, activeQueue });
  } catch (error) { next(error); }
});

export default router;
