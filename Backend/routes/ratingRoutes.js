const express = require('express');
const router = express.Router();

const {
    addUserRating,
    getUserRatings,
    deleteUserRating
} = require('../controllers/ratingController');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/rating', addUserRating);
router.get('/rating/:userId', getUserRatings);
router.delete('/rating/:ratingId', deleteUserRating);

module.exports = router;