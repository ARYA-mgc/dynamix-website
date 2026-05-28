const crypto = require('crypto');
const nodemailer = require('nodemailer');
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
        const { email } = req.body;
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(200).json({ message: 'If the email exists, a reset link was sent.' });

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 3600000;

        await run('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?', [token, tokenExpires, email]);

        const frontendUrl = process.env.FRONTEND_URL || 'https://dynamix-labs-website-file.vercel.app';
        const resetLink = `${frontendUrl}/admin.html?resetToken=${token}&email=${encodeURIComponent(email)}`;
        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: '"DynamiX-Labs Admin" <cubedynamics.10@gmail.com>',
            to: email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click here to reset: ${resetLink}`,
            html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p>`
        });
        
        res.json({ message: 'If the email exists, a reset link was sent.' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
