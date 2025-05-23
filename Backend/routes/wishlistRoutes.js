const express = require('express');
const router = express.Router();
const { getUserWishlist, addBookToWishlist, removeBookFromWishlist,  } = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Wszystkie trasy wymagaj¹ uwierzytelnienia
//router.use(authMiddleware);

// Pobierz wszystkie ksi¹¿ki u¿ytkownika
router.get('/wishlists', getUserWishlist);

// Dodaj ksi¹¿kê do pó³ki u¿ytkownika
router.post('/wishlists', addBookToWishlist);

// Usuñ ksi¹¿kê z pó³ki u¿ytkownika
router.delete('/wishlists/:bookId', removeBookFromWishlist);

module.exports = router;