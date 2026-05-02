const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get rewards (parent sees own; child sees parent's active rewards)
router.get('/', auth, async (req, res) => {
  if (req.user.role === 'parent') {
    const { rows } = await db.query(
      'SELECT * FROM rewards WHERE parent_id=$1 ORDER BY created_at',
      [req.user.id]
    );
    return res.json(rows);
  }
  // child: get parent's rewards
  const { rows: childRows } = await db.query('SELECT parent_id FROM users WHERE id=$1', [req.user.id]);
  const { rows } = await db.query(
    'SELECT * FROM rewards WHERE parent_id=$1 AND is_active=true ORDER BY cost_points',
    [childRows[0].parent_id]
  );
  res.json(rows);
});

// Create reward (parent)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { title, category, cost_points, emoji } = req.body;
  const { rows } = await db.query(
    'INSERT INTO rewards (parent_id, title, category, cost_points, emoji) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [req.user.id, title, category, cost_points, emoji || '🎁']
  );
  res.json(rows[0]);
});

// Delete / deactivate reward (parent)
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  await db.query('UPDATE rewards SET is_active=false WHERE id=$1 AND parent_id=$2', [req.params.id, req.user.id]);
  res.json({ ok: true });
});

// Child purchases reward
router.post('/:id/purchase', auth, async (req, res) => {
  if (req.user.role !== 'child') return res.status(403).json({ error: 'Forbidden' });

  const { rows: rewardRows } = await db.query('SELECT * FROM rewards WHERE id=$1 AND is_active=true', [req.params.id]);
  const reward = rewardRows[0];
  if (!reward) return res.status(404).json({ error: 'Reward not found' });

  const { rows: childRows } = await db.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
  const child = childRows[0];
  if (child.points < reward.cost_points) return res.status(400).json({ error: 'Not enough points' });

  await db.query('UPDATE users SET points = points - $1 WHERE id=$2', [reward.cost_points, req.user.id]);
  const { rows } = await db.query(
    'INSERT INTO reward_purchases (reward_id, child_id) VALUES ($1,$2) RETURNING *',
    [reward.id, req.user.id]
  );

  // Notify parent
  req.io.to(`user:${reward.parent_id}`).emit('reward:purchased', {
    purchase: rows[0],
    reward,
    child_name: req.user.name,
  });

  res.json(rows[0]);
});

module.exports = router;
