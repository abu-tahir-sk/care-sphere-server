import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

const generateToken = (user: { id: string; email: string; name: string; photoURL?: string; role?: string }): string => {
  const jwtSecret = process.env.JWT_SECRET || 'CareSphere_SuperSecret_JWT_Key_2026_SecureKey';
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role,
    },
    jwtSecret,
    { expiresIn: '7d' }
  );
};

// Password validation helper: at least 1 uppercase, at least 1 lowercase, min 6 characters
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  return { valid: true };
};

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, photoURL, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.',
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      photoURL: photoURL?.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    });

    const token = generateToken({
      id: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      photoURL: newUser.photoURL,
      role: newUser.role,
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully! Welcome to CareSphere.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        photoURL: newUser.photoURL,
        bio: newUser.bio,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: error.message,
    });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User with this email was not found.',
      });
      return;
    }

    if (!user.password) {
      res.status(401).json({
        success: false,
        message: 'This account was created via Social Sign-in. Please use Google/GitHub to log in.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Incorrect password. Please verify and try again.',
      });
      return;
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Welcome back! Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again later.',
      error: error.message,
    });
  }
};

// POST /api/auth/social (Google / GitHub login)
export const socialLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name, photoURL } = req.body;

    if (!email || !name) {
      res.status(400).json({
        success: false,
        message: 'Email and name are required for social authentication.',
      });
      return;
    }

    let user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        photoURL: photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'Community member passionate about volunteering and local initiatives.',
      });
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      photoURL: user.photoURL,
      role: user.role,
    });

    res.status(200).json({
      success: true,
      message: 'Social authentication successful! Welcome to CareSphere.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        bio: user.bio,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Social authentication failed.',
      error: error.message,
    });
  }
};

// GET /api/auth/me (Protected)
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        bio: user.bio,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message,
    });
  }
};

// PUT /api/auth/profile (Protected, Optional Task: Update Profile)
export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, photoURL, bio } = req.body;

    if (!name || name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Display name cannot be empty.',
      });
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        name: name.trim(),
        ...(photoURL ? { photoURL: photoURL.trim() } : {}),
        ...(bio ? { bio: bio.trim() } : {}),
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photoURL: updatedUser.photoURL,
        bio: updatedUser.bio,
        role: updatedUser.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};
