import User from '../models/User.js';
import { sendAuthCookie, clearAuthCookie } from '../utils/token.js';
import { badRequest, conflict, unauthorized } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/ApiError.js';
import { validateRegister, validateLogin, validateProfile } from '../utils/validators.js';

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const errors = validateRegister(req.body);
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);

  const { name, email, password } = req.body;
  const existing = await User.findOne({ email: email.trim().toLowerCase() });
  if (existing) throw conflict('An account with this email already exists. Try logging in.');

  const user = await User.create({ name: name.trim(), email: email.trim().toLowerCase(), password });
  sendAuthCookie(res, user, 201);
  res.status(201).json({ user: user.toJSON() });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const errors = validateLogin(req.body);
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw unauthorized('Invalid email or password.');
  }

  sendAuthCookie(res, user);
  res.json({ user: user.toJSON() });
});

/** POST /api/auth/logout */
export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  res.json({ message: 'Logged out.' });
});

/** GET /api/auth/me */
export const getMe = asyncHandler(async (req, res) => {
  res.json({ user: req.user.toJSON() });
});

/** PUT /api/auth/profile */
export const updateProfile = asyncHandler(async (req, res) => {
  const errors = validateProfile(req.body);
  if (Object.keys(errors).length) throw badRequest('Please fix the highlighted fields.', errors);

  const user = req.user;
  const { name, phone, address } = req.body;

  if (name !== undefined) user.name = name.trim();
  if (phone !== undefined) user.phone = String(phone).trim();
  if (address !== undefined) {
    user.address = {
      fullName: address.fullName?.trim() ?? '',
      phone: address.phone?.trim() ?? '',
      line1: address.line1?.trim() ?? '',
      line2: address.line2?.trim() ?? '',
      city: address.city?.trim() ?? '',
      state: address.state?.trim() ?? '',
      postalCode: address.postalCode?.trim() ?? '',
      country: address.country?.trim() || 'India',
    };
  }

  await user.save();
  res.json({ user: user.toJSON() });
});
