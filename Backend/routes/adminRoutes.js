const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');
const adminMiddleware = require('../middleware/adminMiddleware');

// Zastosuj middleware uwierzytelniania i uprawnień administratora do wszystkich tras
router.use(authMiddleware);
router.use(adminMiddleware);

// Pobieranie listy użytkowników
router.get('/users', adminController.getUsers);

// Pobieranie konkretnego użytkownika
router.get('/users/:id', adminController.getUserById);

// Aktualizacja użytkownika
router.put('/users/:id', adminController.updateUser);

// Usuwanie użytkownika
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;