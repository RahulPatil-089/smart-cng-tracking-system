import express from 'express';
import bcrypt from 'bcryptjs';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/profile', protect, (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, vehicleNumber, vehicleType, password } = req.body;
    if (name !== undefined) req.user.name = name;
    if (phone !== undefined) req.user.phone = phone;
    if (vehicleNumber !== undefined) req.user.vehicleNumber = vehicleNumber.toUpperCase();
    if (vehicleType !== undefined) req.user.vehicleType = vehicleType;
    if (password) req.user.password = await bcrypt.hash(password, 12);

    await req.user.save();
    const user = req.user.toObject();
    delete user.password;
    res.json({ user });
  } catch (error) {
    res.status(400).json({ message: 'Profile update failed', error: error.message });
  }
});

export default router;
