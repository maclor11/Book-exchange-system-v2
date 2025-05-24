const express = require('express');
const router = express.Router();

const {
    getUserBooks,
    addBookToShelf,
    removeBookFromShelf,
    getBooksByUsername
} = require('../controllers/bookController');

const authMiddleware = require('../middleware/authMiddleware');

// Wszystkie trasy wymagają uwierzytelnienia
router.use(authMiddleware);

// Pobierz wszystkie książki zalogowanego użytkownika
router.get('/books', getUserBooks);

// Pobierz książki dowolnego użytkownika po userId
router.get('/books/:userId', getBooksByUsername);

// Dodaj książkę do półki użytkownika
router.post('/books', addBookToShelf);

// Usuń książkę z półki użytkownika
router.delete('/books/:bookId', removeBookFromShelf);

module.exports = router;