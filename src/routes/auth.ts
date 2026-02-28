import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database.ts';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

router.post('/register', async (req, res) => {
  const { name, email, password, role, ward_id } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, hashed_password, role, ward_id) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name, email, hashedPassword, role || 'citizen', ward_id || null);
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'User registered successfully' });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
  if (!user) return res.status(400).json({ error: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.hashed_password);
  if (!validPassword) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, ward_id: user.ward_id },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

router.get('/me', (req, res) => {
  // Logic to get current user from token (handled by middleware usually, but here for completeness)
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare('SELECT id, name, email, role, ward_id FROM users WHERE id = ?').get(decoded.id);
    res.json(user);
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
});

router.post('/otp', (req, res) => {
  // Dummy endpoint to prevent 404s if the client is polling this
  res.status(501).json({ error: 'OTP login not implemented yet' });
});

export default router;
