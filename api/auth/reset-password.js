const bcrypt = require('bcrypt');
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

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { email, token, newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const user = await get('SELECT * FROM users WHERE email = ? AND resetToken = ?', [email, token]);
        if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
        if (Date.now() > user.resetTokenExpires) return res.status(400).json({ error: 'Token expired' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await run('UPDATE users SET password = ?, resetToken = NULL, resetTokenExpires = NULL, needsPasswordChange = 0 WHERE email = ?', [hashedPassword, email]);

        res.json({ success: true, message: 'Password has been reset successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
