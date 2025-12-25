const express = require('express');
const router = express.Router();
const pool = require('../db/connection');

//list all books

router.get('/', async (req, res) =>{
    try{
        const result = await pool.query('SELECT * FROM books ORDER BY  date_read DESC');
        res.render('/books',{ books: result.rows});

    } catch(err) {
        console.error(err);
        res.status(500).send('Error fetching books');

    }
});

// Show form to add a book
router.get('/new', (req, res) => {
  res.render('form', { book: null });
});

// Add a new book with ISBN and automatic cover fetching
router.post('/', async (req, res) => {
  try {
    const { title, author, review, rating, date_read, isbn } = req.body;
    // Generate cover URL from ISBN
    const cover_url = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
    await pool.query(
      'INSERT INTO books (title, author, review, rating, date_read, isbn, cover_url) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [title, author, review, rating, date_read, isbn, cover_url]
    );
    res.redirect('/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding book');
  }
});

// Show form to edit a book
router.get('/:id/edit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    res.render('form', { book: result.rows[0] });
  } catch (err) {
     console.error(err);
    res.status(500).send('Error loading book');
  }
});

// Update a book with ISBN and automatic cover fetching
router.post('/:id', async (req, res) => {
  try {
    const { title, author, review, rating, date_read, isbn } = req.body;
    // Generate cover URL from ISBN
    const cover_url = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;
    await pool.query(
      'UPDATE books SET title=$1, author=$2, review=$3, rating=$4, date_read=$5, isbn=$6, cover_url=$7 WHERE id=$8',
      [title, author, review, rating, date_read, isbn, cover_url, req.params.id]
    );
    res.redirect('/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating book');
  }
});

// Delete a book
router.post('/:id/delete', async (req, res) => {
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.redirect('/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting book');
  }
});

module.exports = router;