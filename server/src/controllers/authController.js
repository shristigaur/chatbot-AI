import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import { env } from '../config/env.js';

// Setup JWT secret - using a fallback for dev if needed
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-do-not-use-in-prod';
const OTP_STORE = new Map();

export const signup = async (req, res) => {
  try {
    const { name, email, ageGroup, characterBase, interests, anonymousId } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(400).json({ error: 'Email already exists' });
    
    // Check if we migrate
    if (anonymousId) {
       user = await User.findOne({ anonymousId });
    }
    if (!user) user = new User();
    
    user.email = email.toLowerCase();
    user.name = name || 'Guest';
    user.ageGroup = ageGroup || 'Adult';
    if (characterBase) user.character.baseId = characterBase;
    if (interests) user.interests = interests;
    
    await user.save();
    
    return res.status(201).json({ message: 'User created' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    
    const user = await User.findOne({ email: email.toLowerCase() });
    const authMode = process.env.AUTH_MODE || 'email_only';

    if (authMode === 'email_only') {
      if (!user) return res.status(404).json({ error: 'User not found' });
      return await issueTokens(user, req, res);
    } else {
      if (!otp) {
        // Send OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = crypto.createHash('sha256').update(code).digest('hex');
        OTP_STORE.set(email.toLowerCase(), { hash, expires: Date.now() + 10 * 60000, attempts: 0 });
        console.log(`[DEV] OTP for ${email}: ${code}`);
        return res.status(200).json({ message: 'OTP sent' });
      } else {
        // Verify OTP
        const store = OTP_STORE.get(email.toLowerCase());
        if (!store || store.expires < Date.now()) return res.status(400).json({ error: 'OTP expired or invalid' });
        if (store.attempts >= 5) return res.status(400).json({ error: 'Too many attempts' });
        store.attempts++;
        const hash = crypto.createHash('sha256').update(otp).digest('hex');
        if (store.hash !== hash) return res.status(400).json({ error: 'OTP invalid' });
        
        OTP_STORE.delete(email.toLowerCase());
        if (!user) return res.status(404).json({ error: 'User not found' });
        return await issueTokens(user, req, res);
      }
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

async function issueTokens(user, req, res) {
  const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30'));
  
  await RefreshToken.create({
    userId: user._id,
    tokenHash: hash,
    expiresAt,
    userAgent: req.headers['user-agent']
  });
  
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    path: '/api/auth'
  });
  
  return res.status(200).json({ accessToken, user: { id: user._id, name: user.name, email: user.email } });
}

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });
    
    const hash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenDoc = await RefreshToken.findOne({ tokenHash: hash });
    
    if (!tokenDoc) {
      res.clearCookie('refreshToken', { path: '/api/auth', sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    if (tokenDoc.revokedAt || tokenDoc.expiresAt < new Date()) {
      // revoke family if revoked
      await RefreshToken.updateMany({ userId: tokenDoc.userId }, { revokedAt: new Date() });
      res.clearCookie('refreshToken', { path: '/api/auth', sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
      return res.status(401).json({ error: 'Token revoked or expired' });
    }
    
    const user = await User.findById(tokenDoc.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    
    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedBy = 'rotated';
    await tokenDoc.save();
    
    return await issueTokens(user, req, res);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth', sameSite: 'none', secure: process.env.NODE_ENV === 'production' });
  return res.status(200).json({ message: 'Logged out' });
};
