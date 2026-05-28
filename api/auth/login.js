const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get } = require('../../lib/db');

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { email, password } = req.body;
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ id: user.id, email: user.email, needsPasswordChange: user.needsPasswordChange }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({ token, needsPasswordChange: user.needsPasswordChange === 1 });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
