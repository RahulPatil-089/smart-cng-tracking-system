import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  vehicleNumber: user.vehicleNumber,
  vehicleType: user.vehicleType,
  role: user.role
});

router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, vehicleNumber, vehicleType } = req.body;
    if (!name || !email || !phone || !password || !vehicleNumber || !vehicleType) {
      return res.status(400).json({ message: 'All registration fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'Email is already registered' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      vehicleNumber: vehicleNumber.trim().toUpperCase(),
      vehicleType: vehicleType.trim(),
      role: 'user'
    });

    res.status(201).json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.isActive || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ token: createToken(user._id), user: publicUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

export default router;
