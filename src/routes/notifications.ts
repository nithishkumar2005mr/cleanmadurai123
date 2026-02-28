import express from 'express';
import db from '../db/database.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  const user_id = req.user?.id;
  const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC').all(user_id);
  res.json(notifications);
});

router.patch('/:id/read', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;
  db.prepare('UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?').run(id, user_id);
  res.json({ message: 'Notification marked as read' });
});

export default router;
