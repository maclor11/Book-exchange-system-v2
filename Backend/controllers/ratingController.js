const Rating = require('../models/Rating');
const User = require('../models/User');
const Trade = require('../models/Trade');

exports.addRatingToUser = async (req, res) => {
    try {
        //const { user_id, trade_id, message, stars } = req.body;

        const { user_id, message, stars } = req.body;


        // if (!user_id || !trade_id || !stars) {
        //     return res.status(400).json({ error: 'Missing required fields.' });
        // }

        if (!user_id || !stars) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }

        // const trade = await Trade.findById(trade_id);
        // if (!trade) {
        //     return res.status(404).json({ error: 'Trade not found.' });
        // }

        const rating = new Rating({
            user_id,
            //trade_id,
            message,
            stars
        });

        await rating.save();
        res.status(201).json({ message: 'Rating added successfully.', rating });

    } catch (error) {
        console.error('Error adding user rating:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};


exports.getUserRatings = async (req, res) => {
    try {
        const userId = req.params.userId || req.user.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const ratings = await Rating.find({ user_id: userId })
            .sort({ createdAt: -1 });

        const formatted = ratings.map(r => ({
            id: r._id,
            user_id: r.user_id,
            message: r.message,
            stars: r.stars
        }));

        res.json(formatted);

    } catch (error) {
        console.error('Error fetching user ratings:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};



exports.removeUserRating = async (req, res) => {
    try {
        const { ratingId } = req.params;

        const deleted = await Rating.findByIdAndDelete(ratingId);
        if (!deleted) {
            return res.status(404).json({ error: 'Rating not found.' });
        }

        res.json({ message: 'Rating deleted successfully.' });
    } catch (error) {
        console.error('Error deleting rating:', error);
        res.status(500).json({ error: 'Server error.' });
    }
};


