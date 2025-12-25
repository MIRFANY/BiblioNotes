const express = require('express');
const path = require('path');

const { Pool } = require('pg');
const axios = require('axios');

const app = express();


require('dotenv').config();
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Helper: get cover url from open library
async function getCoverUrl(isbn) {
    if (!isbn) return null;
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
}

// List all books
app.get('/books', async (req, res) => {
    try {
        const sort = req.query.sort || 'date_read DESC';
        const result = await pool.query(`SELECT * FROM books ORDER BY ${sort}`);
        res.render('books', { books: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching books');
    }
});

// Show form to add a book
app.get('/books/new', (req, res) => {
    res.render('form', { book: null });
});

// Add a new book
app.post('/books', async (req, res) => {
    try {
        const { title, author, review, rating, date_read, isbn } = req.body;
        const cover_url = await getCoverUrl(isbn);
        await pool.query(
            'INSERT INTO books (title, author, review, rating, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6)',
            [title, author, review, rating, date_read, cover_url]
        );
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error adding book');
    }
});

// Show form to edit a book
app.get('/books/:id/edit', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
        res.render('form', { book: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error loading book');
    }
});

// Update a book
app.post('/books/:id', async (req, res) => {
    try {
        const { title, author, review, rating, date_read, isbn } = req.body;
        const cover_url = await getCoverUrl(isbn);
        await pool.query(
            'UPDATE books SET title=$1, author=$2, review=$3, rating=$4, date_read=$5, cover_url=$6 WHERE id=$7',
            [title, author, review, rating, date_read, cover_url, req.params.id]
        );
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error updating book');
    }
});

// Delete a book
app.post('/books/:id/delete', async (req, res) => {
    try {
        await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
        res.redirect('/books');
    } catch (err) {
        console.error(err);
        res.status(500).send('Error deleting book');
    }
});

// Home route
app.get('/', (req, res) => {
    res.redirect('/books');
});

// 404 handler
app.use((req, res) => {
    res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
