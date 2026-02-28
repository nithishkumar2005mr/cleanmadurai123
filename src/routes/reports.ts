import express from 'express';
import db from '../db/database.ts';
import { authenticateToken, AuthRequest } from '../middleware/auth.ts';
import { sendReportEmail } from '../services/emailService.ts';

const router = express.Router();

// Get all reports
router.get('/', (req, res) => {
  const { ward_id, status, category } = req.query;
  let query = `
    SELECT r.*, u.name as reporter_name, w.name as ward_name 
    FROM reports r
    JOIN users u ON r.user_id = u.id
    JOIN wards w ON r.ward_id = w.id
    WHERE 1=1
  `;
  const params: any[] = [];

  if (ward_id) {
    query += ' AND r.ward_id = ?';
    params.push(ward_id);
  }
  if (status) {
    query += ' AND r.status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND r.category = ?';
    params.push(category);
  }

  query += ' ORDER BY r.created_at DESC';
  
  const reports = db.prepare(query).all(...params);
  res.json(reports);
});

// Create a report
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  const { ward_id, category, urgency, description, lat, lng, image_urls } = req.body;
  const user_id = req.user?.id;

  try {
    const stmt = db.prepare(`
      INSERT INTO reports (user_id, ward_id, category, urgency, description, lat, lng, image_urls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      user_id,
      ward_id,
      category,
      urgency,
      description,
      lat,
      lng,
      JSON.stringify(image_urls || [])
    );

    // Create notifications for ward officers in this ward
    const officers = db.prepare("SELECT id, email FROM users WHERE role = 'ward_officer' AND ward_id = ?").all(ward_id) as { id: number, email: string }[];
    const notifyStmt = db.prepare('INSERT INTO notifications (user_id, message) VALUES (?, ?)');
    for (const officer of officers) {
      notifyStmt.run(officer.id, `New ${category} report in your ward: ${description.substring(0, 50)}...`);
    }

    // Send emails
    const reporter = db.prepare("SELECT email, name FROM users WHERE id = ?").get(user_id) as { email: string, name: string };
    const ward = db.prepare("SELECT name FROM wards WHERE id = ?").get(ward_id) as { name: string };
    
    const reportData = {
      category,
      urgency,
      description,
      lat,
      lng,
      ward_name: ward.name
    };

    // Email to reporter
    if (reporter && reporter.email) {
      sendReportEmail(reporter.email, `Report Confirmation: ${category}`, reportData);
    }

    // Email to officers
    for (const officer of officers) {
      if (officer.email) {
        sendReportEmail(officer.email, `New Civic Report in Your Ward: ${category}`, reportData);
      }
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Report created' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Get single report
router.get('/:id', (req, res) => {
  const report = db.prepare(`
    SELECT r.*, u.name as reporter_name, w.name as ward_name 
    FROM reports r
    JOIN users u ON r.user_id = u.id
    JOIN wards w ON r.ward_id = w.id
    WHERE r.id = ?
  `).get(req.params.id);

  if (!report) return res.status(404).json({ error: 'Report not found' });
  
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name 
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.report_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);

  res.json({ ...report, comments });
});

// Update status
router.patch('/:id/status', authenticateToken, (req: AuthRequest, res) => {
  const { status } = req.body;
  const { id } = req.params;

  // Role check would happen here (ward_officer or admin)
  if (req.user?.role !== 'ward_officer' && req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Only officers can update status' });
  }

  try {
    const resolved_at = status === 'resolved' ? new Date().toISOString() : null;
    const stmt = db.prepare('UPDATE reports SET status = ?, resolved_at = ? WHERE id = ?');
    stmt.run(status, resolved_at, id);
    res.json({ message: 'Status updated' });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Manual email trigger
router.post('/:id/send-email', authenticateToken, (req: AuthRequest, res) => {
  const { id } = req.params;
  const user_id = req.user?.id;

  try {
    const report = db.prepare(`
      SELECT r.*, u.email as reporter_email, u.name as reporter_name, w.name as ward_name 
      FROM reports r
      JOIN users u ON r.user_id = u.id
      JOIN wards w ON r.ward_id = w.id
      WHERE r.id = ?
    `).get(id) as any;

    if (!report) return res.status(404).json({ error: 'Report not found' });

    const reportData = {
      category: report.category,
      urgency: report.urgency,
      description: report.description,
      lat: report.lat,
      lng: report.lng,
      ward_name: report.ward_name
    };

    // Send to the person who requested it (the current user)
    const currentUser = db.prepare("SELECT email FROM users WHERE id = ?").get(user_id) as { email: string };
    
    if (currentUser && currentUser.email) {
      sendReportEmail(currentUser.email, `Report Copy: ${report.category}`, reportData);
      res.json({ message: 'Email sent successfully' });
    } else {
      res.status(400).json({ error: 'User email not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to send email' });
  }
});

export default router;
