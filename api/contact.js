const nodemailer = require('nodemailer');
const { run } = require('../lib/db');

const allowCors = fn => async (req, res) => {
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  return await fn(req, res)
}

const handler = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { name, email, subject, message } = req.body;
        if (!name || !email || !subject || !message) return res.status(400).json({ error: 'All fields are required' });

        await run('INSERT INTO messages (name, email, subject, message) VALUES (?, ?, ?, ?)', [name, email, subject, message]);

        const adminEmails = [
            'aryamgc.act2024@citchennai.net',
            'ashwinr.act2024@citchennai.net',
            'nithivalavann.aids2024@citchennai.net',
            'vishalmeyyappanr.act2024@citchennai.net',
            'jayarajm.vlsi2024@citchennai.net'
        ];

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
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

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = allowCors(handler);
