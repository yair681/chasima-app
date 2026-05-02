const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// Get tasks (child sees own; parent sees all children's)
router.get('/', auth, async (req, res) => {
  let rows;
  if (req.user.role === 'child') {
    ({ rows } = await db.query(
      'SELECT * FROM tasks WHERE child_id=$1 ORDER BY created_at DESC',
      [req.user.id]
    ));
  } else {
    ({ rows } = await db.query(
      `SELECT t.*, u.name AS child_name FROM tasks t
       JOIN users u ON u.id = t.child_id
       WHERE u.parent_id=$1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    ));
  }
  res.json(rows);
});

// Create task (parent)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { title, category, points, child_id } = req.body;

  const { rows } = await db.query(
    `INSERT INTO tasks (title, category, points, child_id, created_by, status)
     VALUES ($1,$2,$3,$4,$5,'active') RETURNING *`,
    [title, category, points, child_id, req.user.id]
  );

  req.io.to(`user:${child_id}`).emit('task:new', rows[0]);
  res.json(rows[0]);
});

// Child submits task for approval
router.patch('/:id/submit', auth, async (req, res) => {
  if (req.user.role !== 'child') return res.status(403).json({ error: 'Forbidden' });
  const { proof } = req.body;

  const { rows } = await db.query(
    `UPDATE tasks SET status='pending_approval', proof=$1
     WHERE id=$2 AND child_id=$3 AND status='active' RETURNING *`,
    [proof || null, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });

  // Notify parent in real-time
  const { rows: childRows } = await db.query('SELECT parent_id FROM users WHERE id=$1', [req.user.id]);
  req.io.to(`user:${childRows[0].parent_id}`).emit('task:pending', { ...rows[0], child_name: req.user.name });

  res.json(rows[0]);
});

// Parent approves or rejects
router.patch('/:id/review', auth, async (req, res) => {
  if (req.user.role !== 'parent') return res.status(403).json({ error: 'Forbidden' });
  const { action } = req.body; // 'approve' | 'reject'
  const newStatus = action === 'approve' ? 'completed' : 'rejected';

  const { rows } = await db.query(
    `UPDATE tasks SET status=$1, completed_at=NOW()
     WHERE id=$2 AND status='pending_approval' RETURNING *`,
    [newStatus, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Task not found' });

  if (action === 'approve') {
    // Add points to child
    await db.query('UPDATE users SET points = points + $1 WHERE id=$2', [rows[0].points, rows[0].child_id]);
    // Update streak
    await updateStreak(rows[0].child_id);
    req.io.to(`user:${rows[0].child_id}`).emit('task:approved', rows[0]);
  } else {
    req.io.to(`user:${rows[0].child_id}`).emit('task:rejected', rows[0]);
  }

  res.json(rows[0]);
});

async function updateStreak(childId) {
  const { rows } = await db.query('SELECT last_active_date, streak_days FROM users WHERE id=$1', [childId]);
  const user = rows[0];
  const today = new Date().toISOString().slice(0, 10);
  const last = user.last_active_date?.toISOString?.().slice(0, 10);
  const isConsecutive = last && (new Date(today) - new Date(last)) / 86400000 === 1;
  const newStreak = isConsecutive ? user.streak_days + 1 : 1;
  await db.query('UPDATE users SET streak_days=$1, last_active_date=$2 WHERE id=$3', [newStreak, today, childId]);
}

module.exports = router;
