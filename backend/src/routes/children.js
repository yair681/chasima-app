const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Create child (parent only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { name, age } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  const { rows } = await db.query(
    `INSERT INTO users (name, age, role, parent_id, join_code)
     VALUES ($1,$2,'child',$3,$4) RETURNING *`,
    [name, age, req.user.id, code]
  );
  const child = rows[0];

  // Create default screen time policy
  await db.query(
    'INSERT INTO screen_time_policies (child_id) VALUES ($1) ON CONFLICT DO NOTHING',
    [child.id]
  );

  res.json(child);
});

// Get all children for parent
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });

  const { rows } = await db.query(
    `SELECT u.*,
       stp.daily_quota_minutes, stp.is_locked, stp.bedtime_start, stp.bedtime_end,
       COALESCE(stu.minutes_used, 0) AS minutes_used_today
     FROM users u
     LEFT JOIN screen_time_policies stp ON stp.child_id = u.id
     LEFT JOIN screen_time_usage stu ON stu.child_id = u.id AND stu.date = CURRENT_DATE
     WHERE u.parent_id = $1 AND u.role = 'child'
     ORDER BY u.created_at`,
    [req.user.id]
  );

  const children = rows.map(c => ({
    ...c,
    time_left: Math.max(0, (c.daily_quota_minutes || 120) - (c.minutes_used_today || 0)),
  }));

  res.json(children);
});

// Delete child
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  await db.query('DELETE FROM users WHERE id=$1 AND parent_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

module.exports = router;
