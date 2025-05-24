const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

router.use(authMiddleware);

router.get('/login', userController.getCurrentUserLogin);
router.get('/profile-picture', userController.getCurrentUserProfilePicture);
router.get('/profile/:userId', userController.getUserProfileById);
router.put('/login', userController.updateCurrentUserLogin);
router.put('/profile-picture', userController.updateCurrentUserProfilePicture);
router.get('/profile-picture/:userId', authMiddleware, userController.getUserProfilePictureById);
router.put('/password', userController.updateCurrentUserPassword);

module.exports = router;