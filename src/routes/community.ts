import express from 'express';
import db from '../db/database.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';

const router = express.Router();

// Get cleanup events
router.get('/events', (req, res) => {
  const events = db.prepare(`
    SELECT e.*, w.name as ward_name, (SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id) as rsvp_count
    FROM cleanup_events e
    JOIN wards w ON e.ward_id = w.id
    ORDER BY e.date ASC
  `).all();
  res.json(events);
});

// RSVP to event
router.post('/events/:id/rsvp', authenticateToken, (req: AuthRequest, res) => {
  const event_id = req.params.id;
  const user_id = req.user?.id;

  try {
    const stmt = db.prepare('INSERT INTO rsvps (user_id, event_id) VALUES (?, ?)');
    stmt.run(user_id, event_id);
    
    // Award points to volunteer
    db.prepare('INSERT OR IGNORE INTO volunteer_profiles (user_id) VALUES (?)').run(user_id);
    db.prepare('UPDATE volunteer_profiles SET points = points + 10 WHERE user_id = ?').run(user_id);

    res.json({ message: 'RSVP successful, points awarded!' });
  } catch (error) {
    res.status(400).json({ error: 'Already RSVPed or event not found' });
  }
});

// Leaderboard
router.get('/leaderboard', (req, res) => {
  const leaderboard = db.prepare(`
    SELECT u.name, vp.points, vp.badge
    FROM volunteer_profiles vp
    JOIN users u ON vp.user_id = u.id
    ORDER BY vp.points DESC
    LIMIT 10
  `).all();
  res.json(leaderboard);
});

// Add comment
router.post('/comments', authenticateToken, (req: AuthRequest, res) => {
  const { report_id, content } = req.body;
  const user_id = req.user?.id;

  try {
    const stmt = db.prepare('INSERT INTO comments (user_id, report_id, content) VALUES (?, ?, ?)');
    stmt.run(user_id, report_id, content);
    res.status(201).json({ message: 'Comment added' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
