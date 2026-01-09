# Wishlist Feature - Database Setup

To enable the Reading Wishlist feature, you need to create a new `wishlist` table in your PostgreSQL database.

## SQL Migration

Run the following SQL command in your PostgreSQL database:

```sql
CREATE TABLE wishlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    isbn VARCHAR(20),
    cover_url TEXT,
    reason TEXT,
    added_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for faster queries by user
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```

## Features Added

✅ **View Wishlist** - See all books you want to read in the future  
✅ **Add Books** - Add new books with title, author, ISBN, and reason  
✅ **Automatic Cover Fetching** - If you provide an ISBN, the book cover is fetched automatically  
✅ **Mark as Read** - Move a wishlist item to your main book library  
✅ **Remove from Wishlist** - Delete books from your reading wishlist  

## Navigation Updates

- Added "📖 Wishlist" link in the navigation menu across all pages
- Users can now switch between "My Books" and "Wishlist" views

## How to Use

1. **Add to Wishlist**: Click the "📖 Wishlist" link in navigation → "Add Book to Wishlist" button
2. **Mark as Read**: Click "✓ Mark as Read" on a wishlist item to add it to your library
3. **Remove**: Click "✕ Remove" to delete from wishlist

## Routes Added

- `GET /wishlist` - View all wishlist items
- `GET /wishlist/new` - Show form to add new item
- `POST /wishlist` - Create new wishlist item
- `POST /wishlist/:id/read` - Move item to main books library
- `POST /wishlist/:id/delete` - Delete wishlist item
