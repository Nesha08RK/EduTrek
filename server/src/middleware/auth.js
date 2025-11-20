import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev';

/**
 * Middleware to require authentication
 */
export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const payload = jwt.verify(token, JWT_SECRET);

    // Ensure role is always lowercase for consistent comparison
    req.user = {
      ...payload,
      role: payload.role ? String(payload.role).toLowerCase() : null
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
}

/**
 * Middleware to require specific role(s)
 */
export function requireRole(...roles) {
  // Convert all roles to lowercase strings
  const allowedRoles = roles
    .filter(r => r != null)
    .map(r => String(r).toLowerCase());

  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized: User role missing' });
    }

    const userRole = String(req.user.role).toLowerCase();

    if (!allowedRoles.includes(userRole)) {
      console.warn(
        `Access denied. User role: ${req.user.role}, required role(s): ${allowedRoles.join(', ')}`
      );
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}
