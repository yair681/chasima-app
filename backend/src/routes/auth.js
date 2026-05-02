const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const sign = (user) =>
  jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Parent register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING *',
      [name, email, hash, 'parent']
    );
    res.json({ token: sign(rows[0]), user: sanitize(rows[0]) });
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    throw e;
  }
});

// Parent login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE email=$1 AND role=$2', [email, 'parent']);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });
  res.json({ token: sign(user), user: sanitize(user) });
});

// Child login with join code
router.post('/child-login', async (req, res) => {
  const { code } = req.body;
  const { rows } = await db.query('SELECT * FROM users WHERE join_code=$1 AND role=$2', [code, 'child']);
  const child = rows[0];
  if (!child) return res.status(401).json({ error: 'Invalid code' });
  res.json({ token: sign(child), user: sanitize(child) });
});

function sanitize(u) {
  const { password_hash, ...safe } = u;
  return safe;
}

module.exports = router;
