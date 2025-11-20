import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev';
const SALT_ROUNDS = 10;
const uploadsDir = path.join(path.resolve(), 'uploads');

async function saveProfileImage(avatarData, userId) {
  if (typeof avatarData !== 'string' || !avatarData.startsWith('data:')) return null;
  const matches = avatarData.match(/^data:(image\/[a-zA-Z0-9+.+-]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return null;
  const mimeType = matches[1];
  const extension = mimeType.split('/')[1] || 'png';
  const buffer = Buffer.from(matches[2], 'base64');
  await fs.promises.mkdir(uploadsDir, { recursive: true });
  const fileName = `profile-${userId}-${Date.now()}.${extension}`;
  const filePath = path.join(uploadsDir, fileName);
  await fs.promises.writeFile(filePath, buffer);
  return `/uploads/${fileName}`;
}

// -------------------- REGISTER --------------------
export async function register(req, res) {
  try {
    const { name, email, password, role = 'student', degree, avatarData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user (password hashing handled by User pre-save hook)
    const user = new User({
      name,
      email,
      password: password,
      role: role.toLowerCase(), // store role in lowercase
      degree: typeof degree === 'string' ? degree.trim() : ''
    });

    if (avatarData) {
      const savedPath = await saveProfileImage(avatarData, user._id);
      if (savedPath) {
        user.avatarUrl = savedPath;
      }
    }

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Prepare response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      badges: user.badges,
      points: user.points,
      degree: user.degree
    };

    res.status(201).json({ message: 'User registered successfully', token, user: userResponse });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
}

// -------------------- LOGIN --------------------
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.warn(`Login failed: user not found for email=${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.log(`Login attempt: userId=${user._id} email=${email} role=${user.role}`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.warn(`Login failed: invalid password for userId=${user._id} email=${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      badges: user.badges,
      points: user.points,
      degree: user.degree
    };

    res.json({ message: 'Login successful', token, user: userResponse });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

// -------------------- GET CURRENT USER --------------------
export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      badges: user.badges,
      points: user.points,
      degree: user.degree
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Failed to get user data' });
  }
}

// -------------------- UPDATE CURRENT USER --------------------
export async function updateMe(req, res) {
  try {
    const { name, avatarData, degree } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof name === 'string' && name.trim()) user.name = name.trim();
    if (typeof degree === 'string') user.degree = degree.trim();
    if (avatarData) {
      const savedPath = await saveProfileImage(avatarData, user._id);
      if (savedPath) {
        user.avatarUrl = savedPath;
      }
    }

    await user.save();

    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      badges: user.badges,
      points: user.points,
      degree: user.degree
    };

    res.json({ message: 'Profile updated', user: userResponse });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

// -------------------- LOGOUT --------------------
export async function logout(req, res) {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Logout failed' });
  }
}

// -------------------- ADMIN: RESET USER PASSWORD --------------------
export async function adminResetPassword(req, res) {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = newPassword; // will be hashed by pre-save hook on User
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
}
