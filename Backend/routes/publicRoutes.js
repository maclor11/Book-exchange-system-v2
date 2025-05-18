const express = require('express');
const router = express.Router();
const { getAllBooks } = require('../controllers/bookController');

// Publiczny endpoint do wyświetlania wszystkich książek
router.get('/books', getAllBooks);

module.exports = router;