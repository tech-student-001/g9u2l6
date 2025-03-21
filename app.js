const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Session for authentication
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Connect to SQLite3 database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error("Database connection failed:", err);
    else console.log("Connected to SQLite3 database.");
});

// Create tables if they do not exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS artworks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        image TEXT,
        style TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT,
        phone TEXT,
        message TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`, (err) => {
        if (err) {
            console.error("Error creating users table:", err);
        } else {
            console.log("Users table is ready.");
            seedDatabase(); // Call function to insert initial data **AFTER** table creation
        }
    });
});

// Function to seed database after table creation
function seedDatabase() {
    console.log("Seeding database...");

    // Seed Users
    const adminPassword = bcrypt.hashSync("password", 10);
    db.run("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)", ["admin", adminPassword]);

    // Seed Artworks
    const artworks = [
        { title: "Starry Night", image: "https://saudigazette.com.sa/uploads/images/2021/07/01/1818162.jpeg", style: "Post-Impressionism" },
        { title: "Caravan in the Desert", image: "https://images.joseartgallery.com/8493/conversions/landscape-painting-caravan-saudi-arabia-thumb900.jpg", style: "Impressionist/Realist Painting" },
        { title: "Hijazi architecture", image: "https://www.saudigazette.com.sa/uploads/images/2019/02/18/1160113.JPG", style: "Expressionism" },
        { title: "Mural", image: "https://saudigazette.com.sa/uploads/images/2019/10/07/1379075.jpg", style: "Mural painting" },
        { title: "Spiral Motif", image: "https://www.saudigazette.com.sa/uploads/images/2019/02/18/1160112.JPG", style: "Abstract textile art" }
    ];

    artworks.forEach(art => {
        db.run("INSERT OR IGNORE INTO artworks (title, image, style) VALUES (?, ?, ?)", [art.title, art.image, art.style]);
    });

    // Seed Contacts
    const contacts = [
        { name: "Alice Gartner", email: "alice@example.com", phone: "9876543210", message: "Hello World!\nthis is my first message \"Hehe\"" },
        { name: "Brain Griffin", email: "brain@example.com", phone: "9999999999", message: "Woof woof" },
        { name: "Mary Jane", email: "mary@example.com", phone: "0989898798", message: "contact me at ********* lets talk art" }
    ];

    contacts.forEach(contact => {
        db.run("INSERT OR IGNORE INTO contacts (name, email, phone, message) VALUES (?, ?, ?, ?)", 
            [contact.name, contact.email, contact.phone, contact.message]);
    });

    console.log("Database seeded successfully.");
}




app.get('/api/artworks', (req, res) => {
    db.all("SELECT * FROM artworks", [], (err, rows) => {
        if (err) {
            console.error("Error fetching artworks:", err);
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(rows);  // ✅ Converts SQLite3 result to JSON automatically
    });
});

// Middleware to check if the user is logged in
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login.html');  // Redirect to login page if not logged in
    }
    next();  // Continue to the next middleware or route handler
}

// Protect the manage_contact page
app.get('/manage_contact', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'manage_contact.html'));
});

// Protect the contacts API
app.get('/api/contacts', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: "Unauthorized access" });
    }

    db.all("SELECT * FROM contacts", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: "Internal Server Error" });
        }
        res.json(rows);
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) return res.status(401).json({ error: "Invalid credentials" });

        if (bcrypt.compareSync(password, user.password)) {  // Password check
            req.session.user = user.username;
            return res.json({ message: "Login successful" });
        } else {
            return res.status(401).json({ error: "Invalid credentials" });
        }
    });
});


// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));