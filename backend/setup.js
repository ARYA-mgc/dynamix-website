const { run } = require('./db');
const bcrypt = require('bcrypt');

const seedUsers = async () => {
    try {
        // Create users table
        await run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                needsPasswordChange BOOLEAN DEFAULT 1,
                resetToken TEXT,
                resetTokenExpires DATETIME
            )
        `);

        // Create messages table
        await run(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                subject TEXT NOT NULL,
                message TEXT NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                read BOOLEAN DEFAULT 0
            )
        `);

        console.log('Tables created or already exist.');

        const adminEmails = [
            'aryamgc.act2024@citchennai.net',
            'ashwinr.act2024@citchennai.net',
            'nithivalavann.aids2024@citchennai.net',
            'vishalmeyyappanr.act2024@citchennai.net',
            'jayarajm.vlsi2024@citchennai.net'
        ];

        const defaultPassword = 'Changeme123!';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

        for (const email of adminEmails) {
            // Check if user exists
            try {
                await run('INSERT INTO users (email, password, needsPasswordChange) VALUES (?, ?, 1)', [email, hashedPassword]);
                console.log(`Seeded user: ${email}`);
            } catch (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    console.log(`User ${email} already exists.`);
                } else {
                    console.error(`Error inserting ${email}:`, err);
                }
            }
        }

        console.log('Database setup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
};

seedUsers();
