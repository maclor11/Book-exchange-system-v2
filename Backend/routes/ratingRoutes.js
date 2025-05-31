const express = require('express');
const router = express.Router();

const {
    addRatingToUser,
    getUserRatings,
    removeUserRating
} = require('../controllers/ratingController');

const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/rating', addRatingToUser);
router.get('/rating/:userId?', getUserRatings);
router.delete('/rating/:ratingId', removeUserRating);

module.exports = router;