const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const User = require('../models/User');

const googleClientId = process.env.GOOGLE_OAUTH_CLIENT_ID || '790052168332-frjkt93h5f5ptin93vrjecauqgonkm3o.apps.googleusercontent.com';
const client = new OAuth2Client(googleClientId);

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;
    
    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.create({ googleId, email, name, picture });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });
    
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        currentStreak: user.currentStreak
      }
    });
  } catch (error) {
    console.error('Google verification error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.string().max(50).optional(),
  organization: z.string().max(100).optional()
});

const emailRegister = async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.errors });
  }

  const { name, email, password, role, organization } = result.data;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      organization
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        currentStreak: user.currentStreak
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
};

const loginSchema = z.object({
  email: z.string().email('Invalid email address').max(254),
  password: z.string().min(1, 'Password is required').max(100)
});

const emailLogin = async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.errors });
  }

  const { email, password } = result.data;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret123', {
      expiresIn: '7d',
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        picture: user.picture,
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        currentStreak: user.currentStreak
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
};

module.exports = { googleLogin, emailRegister, emailLogin };
