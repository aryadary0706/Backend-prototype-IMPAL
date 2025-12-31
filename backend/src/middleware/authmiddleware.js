import 'dotenv/config';
import jwt from "jsonwebtoken";

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Akses ditolak, token hilang" });

  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Server misconfigured: JWT_SECRET belum diset" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ error: "Token kadaluarsa" });
      }
      return res.status(403).json({ error: "Token tidak valid" });
    }
    req.user = user; // Data user dari token disimpan di req.user
    next();
  });
};