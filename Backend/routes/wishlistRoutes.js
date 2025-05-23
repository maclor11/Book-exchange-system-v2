const express = require('express');
const router = express.Router();
const { getUserWishlist, addBookToWishlist, removeBookFromWishlist,  } = require('../controllers/wishlistController');
const authMiddleware = require('../middleware/authMiddleware');

// Wszystkie trasy wymagaj� uwierzytelnienia
//router.use(authMiddleware);

// Pobierz wszystkie ksi��ki u�ytkownika
router.get('/wishlists', getUserWishlist);

// Dodaj ksi��k� do p�ki u�ytkownika
router.post('/wishlists', addBookToWishlist);

// Usu� ksi��k� z p�ki u�ytkownika
router.delete('/wishlists/:bookId', removeBookFromWishlist);

module.exports = router;