import express from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  vehicleNumber: user.vehicleNumber,
  vehicleType: user.vehicleType,
  role: user.role
});

router.get('/profile', protect, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, vehicleNumber, vehicleType, password } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber.trim().toUpperCase();
    if (vehicleType !== undefined) user.vehicleType = vehicleType.trim();
    if (password) {
      if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
      user.password = await bcrypt.hash(password, 12);
    }

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (error) {
    res.status(400).json({ message: 'Profile update failed', error: error.message });
  }
});

export default router;
