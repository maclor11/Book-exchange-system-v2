const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const mainPageController = require('../controllers/mainPageController');

router.get('/users', mainPageController.getUsers);
router.get('/users/others', mainPageController.getOtherUsers);
router.get('/userbooks/:id', mainPageController.getBooksByOtherUsers);
router.get('/userbooks', mainPageController.getAllBooks);


module.exports = router;