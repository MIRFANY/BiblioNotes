
const express = require('express');
const path = require('path');

const { Pool } = require('pg');
const axios = require('axios');
const app = express();


const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

require('dotenv').config();
const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT,
});

function requireLogin(req, res, next) {
    if (!req.session.userId) {
        return res.redirect('/login');
    }
    next();
}

// Session middleware
app.use(session({
    store: new pgSession({ pool }),
    secret: process.env.SESSION_SECRET || 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));





const bcrypt = require('bcrypt');
// Registration form
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Handle registration
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('register', { error: 'Username and password required.' });
    }
    try {
        const hash = await bcrypt.hash(password, 10);
        await pool.query('INSERT INTO users (username, password) VALUES ($1, $2)', [username, hash]);
        res.redirect('/login');
    } catch (err) {
        if (err.code === '23505') {
            res.render('register', { error: 'Username already exists.' });
        } else {
            console.error(err);
            res.render('register', { error: 'Registration failed.' });
        }
    }
});

// Login form
app.get('/login', (req, res) => {
    res.render('login', { error: null });
});

// Handle login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.render('login', { error: 'Username and password required.' });
    }
    try {
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];
        if (!user) {
            return res.render('login', { error: 'Invalid username or password.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.render('login', { error: 'Invalid username or password.' });
        }
        req.session.userId = user.id;
        req.session.username = user.username;
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.render('login', { error: 'Login failed.' });
    }
});

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});
// Helper: get cover url from open library
async function getCoverUrl(isbn) {
    if (!isbn) return null;
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// List all books
app.get('/books', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM books WHERE user_id = $1 ORDER BY date_read DESC`, [req.session.userId]);
        res.render('books', { books: result.rows, username: req.session.username, loggedIn: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching books');
    }
});

// Show form to add a book
app.get('/books/new', requireLogin, (req, res) => {
    res.render('form', { book: null });
});

// Add a new book
app.post('/books', requireLogin, async (req, res) => {
    try {
        const { title, author, review, rating, date_read, isbn } = req.body;
        const cover_url = await getCoverUrl(isbn);
        await pool.query(
            'INSERT INTO books (title, author, review, rating, date_read, cover_url, user_id) VALUES ($1, $2, $3, $4, $5, $6, $7)',
            [title, author, review, rating, date_read, cover_url, req.session.userId]
        );
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding book');
    }
});

// Show form to edit a book
app.get('/books/:id/edit', requireLogin, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId]);
        res.render('form', { book: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading book');
    }
});

// Update a book
app.post('/books/:id', requireLogin, async (req, res) => {
    try {
        const { title, author, review, rating, date_read, isbn } = req.body;
        const cover_url = await getCoverUrl(isbn);
        await pool.query(
            'UPDATE books SET title=$1, author=$2, review=$3, rating=$4, date_read=$5, cover_url=$6 WHERE id=$7 AND user_id=$8',
            [title, author, review, rating, date_read, cover_url, req.params.id, req.session.userId]
        );
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating book');
    }
});

// Delete a book
app.post('/books/:id/delete', requireLogin, async (req, res) => {
    try {
        await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId]);
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting book');
    }
});

// Home route
app.get('/', (req, res) => {
    const loggedIn = req.session.userId ? true : false;
    const username = req.session.username || null;
    res.render('home', { loggedIn, username });
});

// List all wishlist items
app.get('/wishlist', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(`SELECT * FROM wishlist WHERE user_id = $1 ORDER BY added_date DESC`, [req.session.userId]);
        res.render('wishlist', { wishlistItems: result.rows, username: req.session.username, loggedIn: true });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching wishlist');
    }
});

// Show form to add a book to wishlist
app.get('/wishlist/new', requireLogin, (req, res) => {
    res.render('wishlist-form', { item: null, username: req.session.username, loggedIn: true });
});

// Add a new book to wishlist
app.post('/wishlist', requireLogin, async (req, res) => {
    try {
        const { title, author, isbn, reason } = req.body;
        const cover_url = await getCoverUrl(isbn);
        await pool.query(
            'INSERT INTO wishlist (title, author, isbn, cover_url, reason, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
            [title, author, isbn, cover_url, reason, req.session.userId]
        );
        res.redirect('/wishlist');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding book to wishlist');
    }
});

// Move wishlist item to books (mark as read)
app.post('/wishlist/:id/read', requireLogin, async (req, res) => {
    try {
        const itemResult = await pool.query('SELECT * FROM wishlist WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId]);
        if (itemResult.rows.length === 0) {
            return res.status(404).send('Item not found');
        }
        const item = itemResult.rows[0];
        
        // Add to books
        await pool.query(
            'INSERT INTO books (title, author, isbn, cover_url, user_id) VALUES ($1, $2, $3, $4, $5)',
            [item.title, item.author, item.isbn, item.cover_url, req.session.userId]
        );
        
        // Remove from wishlist
        await pool.query('DELETE FROM wishlist WHERE id = $1', [req.params.id]);
        res.redirect('/wishlist');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error moving book to library');
    }
});

// Delete a wishlist item
app.post('/wishlist/:id/delete', requireLogin, async (req, res) => {
    try {
        await pool.query('DELETE FROM wishlist WHERE id = $1 AND user_id = $2', [req.params.id, req.session.userId]);
        res.redirect('/wishlist');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting wishlist item');
    }
});

// Demo/Showcase page for books listing
app.get('/demo', (req, res) => {
    const demoBooks = [
        {
            id: 1,
            title: 'To Kill a Mockingbird',
            author: 'Harper Lee',
            review: 'A classic novel about racial injustice and childhood innocence.',
            rating: 5,
            date_read: new Date('2024-01-15'),
            isbn: '9780061120084',
            cover_url: 'https://covers.openlibrary.org/b/isbn/9780061120084-L.jpg'
        },
        {
            id: 2,
            title: '1984',
            author: 'George Orwell',
            review: 'A dystopian masterpiece depicting a totalitarian society.',
            rating: 5,
            date_read: new Date('2024-02-20'),
            isbn: '9780451524935',
            cover_url: 'https://covers.openlibrary.org/b/isbn/9780451524935-L.jpg'
        },
        {
            id: 3,
            title: 'The Great Gatsby',
            author: 'F. Scott Fitzgerald',
            review: 'An elegant tale of wealth, love, and the American Dream.',
            rating: 4,
            date_read: new Date('2024-03-10'),
            isbn: '9780743273565',
            cover_url: 'https://covers.openlibrary.org/b/isbn/9780743273565-L.jpg'
        },
        {
            id: 4,
            title: 'Pride and Prejudice',
            author: 'Jane Austen',
            review: 'A timeless romance with witty dialogue and social commentary.',
            rating: 5,
            date_read: new Date('2024-04-05'),
            isbn: '9780141439518',
            cover_url: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg'
        }
    ];
    res.render('demo-books', { books: demoBooks, username: 'Demo User' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3070;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
