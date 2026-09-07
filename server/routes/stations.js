import express from 'express';
import Station from '../models/Station.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const { search = '', status = '', maxDistance } = req.query;
    const filter = { approved: true };
    if (status && status !== 'All') filter.status = status;
    if (search.trim()) filter.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { address: { $regex: search.trim(), $options: 'i' } }
    ];
    let stations = await Station.find(filter).sort({ name: 1 }).lean();

    if (maxDistance && req.query.latitude && req.query.longitude) {
      const lat = Number(req.query.latitude); const lng = Number(req.query.longitude); const limit = Number(maxDistance);
      stations = stations.filter((station) => haversineKm(lat, lng, station.latitude, station.longitude) <= limit);
    }
    stations = stations.map((station) => ({ ...station, distanceKm: req.query.latitude && req.query.longitude ? Number(haversineKm(Number(req.query.latitude), Number(req.query.longitude), station.latitude, station.longitude).toFixed(1)) : null }));
    res.json({ stations });
  } catch (error) { res.status(500).json({ message: 'Unable to load stations', error: error.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const station = await Station.findOne({ _id: req.params.id, approved: true }).lean();
    if (!station) return res.status(404).json({ message: 'Station not found' });
    res.json({ station });
  } catch (error) { res.status(400).json({ message: 'Invalid station id' }); }
});

router.post('/', protect, authorize('station_admin', 'system_admin'), async (req, res) => {
  try { const station = await Station.create(req.body); res.status(201).json({ station }); }
  catch (error) { res.status(400).json({ message: 'Unable to create station', error: error.message }); }
});

router.put('/:id', protect, authorize('station_admin', 'system_admin'), async (req, res) => {
  try { const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }); if (!station) return res.status(404).json({ message: 'Station not found' }); res.json({ station }); }
  catch (error) { res.status(400).json({ message: 'Unable to update station', error: error.message }); }
});

router.delete('/:id', protect, authorize('system_admin'), async (req, res) => {
  try { const station = await Station.findByIdAndDelete(req.params.id); if (!station) return res.status(404).json({ message: 'Station not found' }); res.json({ message: 'Station deleted' }); }
  catch (error) { res.status(400).json({ message: 'Unable to delete station', error: error.message }); }
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; const dLat = ((lat2-lat1)*Math.PI)/180; const dLon = ((lon2-lon1)*Math.PI)/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

export default router;
