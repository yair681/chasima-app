const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get policy for a child
router.get('/:childId', auth, async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM screen_time_policies WHERE child_id=$1',
    [req.params.childId]
  );
  res.json(rows[0] || null);
});

// Update policy (parent)
router.put('/:childId', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { daily_quota_minutes, bedtime_start, bedtime_end, weekend_bonus_minutes } = req.body;

  const { rows } = await db.query(
    `INSERT INTO screen_time_policies (child_id, daily_quota_minutes, bedtime_start, bedtime_end, weekend_bonus_minutes)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (child_id) DO UPDATE SET
       daily_quota_minutes=$2, bedtime_start=$3, bedtime_end=$4,
       weekend_bonus_minutes=$5, updated_at=NOW()
     RETURNING *`,
    [req.params.childId, daily_quota_minutes, bedtime_start, bedtime_end, weekend_bonus_minutes]
  );

  req.io.to(`user:${req.params.childId}`).emit('screentime:policy_updated', rows[0]);
  res.json(rows[0]);
});

// Lock / Unlock device (parent)
router.patch('/:childId/lock', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { locked, reason } = req.body;

  const { rows } = await db.query(
    `UPDATE screen_time_policies SET is_locked=$1, lock_reason=$2, updated_at=NOW()
     WHERE child_id=$3 RETURNING *`,
    [locked, reason || null, req.params.childId]
  );

  req.io.to(`user:${req.params.childId}`).emit('screentime:lock_changed', { locked, reason });
  res.json(rows[0]);
});

// Add bonus time (parent)
router.patch('/:childId/bonus', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { minutes = 15 } = req.body;

  // Reduce today's usage by bonus minutes (effectively adding time)
  await db.query(
    `INSERT INTO screen_time_usage (child_id, date, minutes_used)
     VALUES ($1, CURRENT_DATE, 0)
     ON CONFLICT (child_id, date) DO UPDATE
     SET minutes_used = GREATEST(0, screen_time_usage.minutes_used - $2)`,
    [req.params.childId, minutes]
  );

  req.io.to(`user:${req.params.childId}`).emit('screentime:bonus', { minutes });
  res.json({ ok: true, minutes });
});

// Child reports usage (called periodically from child app)
router.post('/usage', auth, async (req, res) => {
  if (req.user.role !== 'child') return res.status(403).json({ error: 'Forbidden' });
  const { minutes } = req.body;

  const { rows } = await db.query(
    `INSERT INTO screen_time_usage (child_id, date, minutes_used)
     VALUES ($1, CURRENT_DATE, $2)
     ON CONFLICT (child_id, date) DO UPDATE
     SET minutes_used = screen_time_usage.minutes_used + $2
     RETURNING *`,
    [req.user.id, minutes]
  );

  // Notify parent of usage update
  const { rows: childRows } = await db.query('SELECT parent_id FROM users WHERE id=$1', [req.user.id]);
  req.io.to(`user:${childRows[0].parent_id}`).emit('screentime:usage_updated', {
    child_id: req.user.id,
    minutes_used: rows[0].minutes_used,
  });

  res.json(rows[0]);
});

module.exports = router;
