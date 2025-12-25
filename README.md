
# Book Notes Web App

A full-stack web application to track, review, and rate books, featuring a modern olive and white UI with bold animations. Built with Node.js, Express.js, PostgreSQL, EJS, and the Open Library Covers API.

## Features

- Add, edit, and delete book entries
- Sort books by rating and recency
- Fetch book covers by ISBN
- Responsive, visually appealing design
- Large-scale page and card animations
- PostgreSQL database 

## Tech Stack

- Node.js
- Express.js
- PostgreSQL
- EJS templating
- Axios (API requests)
- Open Library Covers API
- Modern CSS

## Setup Instructions

1. **Clone the repository**
   ```
   git clone <your-repo-url>
   cd bookRevHist
   ```
2. **Install dependencies**
    npm install
   ```
   ```
4. **Configure PostgreSQL**
   - Ensure PostgreSQL is running locally
   - Create a database named `booknotes`
   - Create the `books` table:
     ```sql
     CREATE TABLE books (
       id SERIAL PRIMARY KEY,
       title VARCHAR(255) NOT NULL,
       author VARCHAR(255),
       review TEXT,
       rating INTEGER,
       date_read DATE,
       isbn VARCHAR(20),
       cover_url VARCHAR(255)
     );
     ```
   - Update your database credentials in `db/connection.js`
5. **Start the server**
   ```
   npm run dev
   # or
   npm start
   ```
6. **Open the app**
   - Visit [http://localhost:3000/books](http://localhost:3000/books) in your browser

## Usage

- Add new books with title, author, review, rating, ISBN, and date read
- Edit or delete existing entries
- Covers are fetched automatically using ISBN
- Enjoy a clean, animated UI

## API Reference

- [Open Library Covers API](https://openlibrary.org/dev/docs/api/covers)

## License

MIT
=======
 

