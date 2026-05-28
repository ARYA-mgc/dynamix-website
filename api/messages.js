const jwt = require('jsonwebtoken');
const { all } = require('../lib/db');

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
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method Not Allowed' });

    const user = authenticateToken(req, res);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const messages = await all('SELECT * FROM messages ORDER BY createdAt DESC');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
