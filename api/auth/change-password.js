const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { get, run } = require('../../lib/db');

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

const authenticateToken = (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        return null;
    }
};

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    const userToken = authenticateToken(req, res);
    if (!userToken) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const { oldPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const user = await get('SELECT * FROM users WHERE id = ?', [userToken.id]);
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Incorrect old password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await run('UPDATE users SET password = ?, needsPasswordChange = 0 WHERE id = ?', [hashedPassword, userToken.id]);
        
        const token = jwt.sign({ id: user.id, email: user.email, needsPasswordChange: 0 }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
