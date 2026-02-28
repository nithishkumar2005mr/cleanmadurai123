import express from 'express';
import db from '../db/database.ts';

const router = express.Router();

router.get('/', (req, res) => {
  const wards = db.prepare('SELECT * FROM wards ORDER BY name ASC').all();
  res.json(wards);
});

export default router;
