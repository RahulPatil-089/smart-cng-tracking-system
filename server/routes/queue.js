import express from 'express';
import Queue from '../models/Queue.js';
import Station from '../models/Station.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

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

router.get('/stations/:id/queue', protect, async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id).select('name queueLength averageServiceMinutes');
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    const queue = await refreshStationQueue(station._id);
    const populated = await Queue.find({ stationId: station._id, status: { $in: ['Waiting', 'Refueling'] } }).sort({ position: 1 }).populate('userId', 'name');
    res.json({ station, queue: populated });
  } catch (error) { next(error); }
});

router.post('/stations/:id/queue', protect, async (req, res, next) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: 'Station not found.' });
    if (station.status === 'Closed') return res.status(400).json({ message: 'This station is closed.' });
    const existing = await Queue.findOne({ stationId: station._id, userId: req.user._id, status: { $in: ['Waiting', 'Refueling'] } });
    if (existing) return res.status(409).json({ message: 'You are already in this station queue.', queue: existing });
    const active = await Queue.countDocuments({ stationId: station._id, status: { $in: ['Waiting', 'Refueling'] } });
    const queue = await Queue.create({ stationId: station._id, userId: req.user._id, vehicleNumber: req.user.vehicleNumber, position: active + 1, estimatedWaitTime: active * (station.averageServiceMinutes || 8) });
    await refreshStationQueue(station._id);
    res.status(201).json({ message: 'Joined the queue.', queue });
  } catch (error) { next(error); }
});

router.delete('/queue/:id', protect, async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) return res.status(404).json({ message: 'Queue entry not found.' });
    if (queue.userId.toString() !== req.user._id.toString() && !['station_admin', 'system_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized.' });
    queue.status = 'Cancelled';
    await queue.save();
    await refreshStationQueue(queue.stationId);
    res.json({ message: 'Removed from queue.' });
  } catch (error) { next(error); }
});

router.put('/queue/:id/status', protect, authorize('station_admin', 'system_admin'), async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);
    if (!queue) return res.status(404).json({ message: 'Queue entry not found.' });
    if (!['Waiting', 'Refueling', 'Completed', 'Cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Invalid queue status.' });
    queue.status = req.body.status;
    await queue.save();
    const active = await refreshStationQueue(queue.stationId);
    res.json({ message: 'Queue status updated.', queue, activeQueue: active });
  } catch (error) { next(error); }
});

export default router;
