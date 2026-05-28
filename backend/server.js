require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { get, all, run } = require('./db');

const app = express();
app.use(express.json());
app.use(helmet());
app.use(cors()); // Allow all origins for local development

// Rate limiters
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: "Too many attempts, please try again later." });
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: "Too many messages sent from this IP, please try again later." });

// Email Transporter (Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- AUTH ROUTES ---

app.post('/api/auth/login', authLimiter, async (req, res) => {
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
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!newPassword || newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const user = await get('SELECT * FROM users WHERE id = ?', [req.user.id]);
        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Incorrect old password' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await run('UPDATE users SET password = ?, needsPasswordChange = 0 WHERE id = ?', [hashedPassword, req.user.id]);
        
        // Generate new token without needsPasswordChange flag
        const token = jwt.sign({ id: user.id, email: user.email, needsPasswordChange: 0 }, process.env.JWT_SECRET, { expiresIn: '12h' });
        res.json({ success: true, token });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        const user = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) return res.status(200).json({ message: 'If the email exists, a reset link was sent.' }); // Don't leak emails

        const token = crypto.randomBytes(32).toString('hex');
        const tokenExpires = Date.now() + 3600000; // 1 hour

        await run('UPDATE users SET resetToken = ?, resetTokenExpires = ? WHERE email = ?', [token, tokenExpires, email]);

        const resetLink = `${process.env.FRONTEND_URL}/admin.html?resetToken=${token}&email=${encodeURIComponent(email)}`;
        
        let info = await transporter.sendMail({
            from: '"DynamiX-Labs Admin" <cubedynamics.10@gmail.com>',
            to: email,
            subject: "Password Reset Request",
            text: `You requested a password reset. Click here to reset: ${resetLink}`,
            html: `<p>You requested a password reset.</p><p><a href="${resetLink}">Click here to reset your password</a></p>`
        });
        
        console.log("Email sent successfully!");

        res.json({ message: 'If the email exists, a reset link was sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
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
});

// --- MESSAGES ROUTES ---

app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields are required' });

        await run('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);

        // Send email notification to all 5 admins
        const adminEmails = [
            'aryamgc.act2024@citchennai.net',
            'ashwinr.act2024@citchennai.net',
            'nithivalavann.aids2024@citchennai.net',
            'vishalmeyyappanr.act2024@citchennai.net',
            'jayarajm.vlsi2024@citchennai.net'
        ];

        let info = await transporter.sendMail({
            from: '"DynamiX-Labs Contact Form" <cubedynamics.10@gmail.com>',
            to: adminEmails.join(', '),
            subject: `New Contact Message: ${subject}`,
            text: `You have received a new message via the DynamiX-Labs contact form.\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n${message}`,
            html: `<div style="font-family: sans-serif; padding: 20px;">
                     <h2>New Contact Message</h2>
                     <p><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
                     <p><strong>Subject:</strong> ${subject}</p>
                     <hr>
                     <p style="white-space: pre-wrap;">${message}</p>
                   </div>`
        });
        
        console.log("Contact email sent successfully!");

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await all('SELECT * FROM messages ORDER BY createdAt DESC');
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
