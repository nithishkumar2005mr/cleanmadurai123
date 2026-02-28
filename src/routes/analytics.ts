import express from 'express';
import db from '../db/database.ts';

const router = express.Router();

router.get('/overview', (req, res) => {
  const totalReports = db.prepare('SELECT COUNT(*) as count FROM reports').get() as any;
  const resolvedReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'resolved' OR status = 'closed'").get() as any;
  const pendingReports = db.prepare("SELECT COUNT(*) as count FROM reports WHERE status = 'pending'").get() as any;
  
  const reportsByWard = db.prepare(`
    SELECT w.name, COUNT(r.id) as count 
    FROM wards w
    LEFT JOIN reports r ON w.id = r.ward_id
    GROUP BY w.id
  `).all();

  const reportsByCategory = db.prepare(`
    SELECT category, COUNT(*) as count 
    FROM reports 
    GROUP BY category
  `).all();

  res.json({
    total: totalReports.count,
    resolved: resolvedReports.count,
    pending: pendingReports.count,
    byWard: reportsByWard,
    byCategory: reportsByCategory
  });
});

router.get('/trends', (req, res) => {
  const trends = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM reports
    GROUP BY month
    ORDER BY month ASC
    LIMIT 12
  `).all();
  res.json(trends);
});

router.get('/predictions', (req, res) => {
  // Simple prediction logic: Average reports per month + 10% growth factor for simulation
  const monthlyData = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COUNT(*) as count
    FROM reports
    GROUP BY month
    ORDER BY month ASC
  `).all() as any[];

  if (monthlyData.length < 2) {
    return res.json({ message: 'Insufficient data for prediction', predicted: 5 });
  }

  const counts = monthlyData.map(d => d.count);
  const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
  const predicted = Math.round(avg * 1.1); // Simple 10% increase prediction

  res.json({
    current_avg: avg,
    predicted_next_month: predicted,
    confidence: 0.75
  });
});

export default router;
