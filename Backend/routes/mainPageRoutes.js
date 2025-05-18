const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const mainPageController = require('../controllers/mainPageController');

router.get('/user-books', mainPageController.getAllBooks);
router.get('/users', mainPageController.getUsers);

router.get('/users/others', mainPageController.getOtherUsers);
router.get('/user-books/:id', mainPageController.getBooksByOtherUsers);



module.exports = router;