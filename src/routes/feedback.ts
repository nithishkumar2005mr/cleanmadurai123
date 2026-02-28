import express from 'express';
import db from '../db/database.ts';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

// Middleware to authenticate
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Submit feedback
router.post('/', authenticate, (req: any, res: any) => {
  const { report_id, rating, comments } = req.body;
  const user_id = req.user.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    const stmt = db.prepare('INSERT INTO feedback (user_id, report_id, rating, comments) VALUES (?, ?, ?, ?)');
    const result = stmt.run(user_id, report_id || null, rating, comments || null);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback (for officers/admins)
router.get('/', authenticate, (req: any, res: any) => {
  if (req.user.role !== 'ward_officer' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const feedback = db.prepare(`
      SELECT f.*, u.name as user_name, r.category as report_category
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN reports r ON f.report_id = r.id
      ORDER BY f.created_at DESC
    `).all();
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
});

export default router;
