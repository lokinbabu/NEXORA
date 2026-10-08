import jwt from 'jsonwebtoken';

const COOKIE_NAME = 'token';

export function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: `${process.env.JWT_EXPIRES_DAYS || 7}d`,
  });
}

/**
 * Send the JWT as an httpOnly cookie (primary) — JavaScript can never read it,
 * which protects the session from XSS. A Bearer-token fallback is also accepted
 * by the API for non-browser clients.
 */
export function sendAuthCookie(res, user, statusCode = 200) {
  const token = signToken(user);
  const isProd = process.env.NODE_ENV === 'production';
  const secure = isProd; // deployment behind HTTPS (Render/Railway/etc.)

  res.status(statusCode).cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure,
    sameSite: isProd ? 'none' : 'lax', // none+secure allows split-domain deployments over HTTPS
    maxAge: (Number(process.env.JWT_EXPIRES_DAYS) || 7) * 24 * 60 * 60 * 1000,
    path: '/',
  });
  return token;
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
}
