const Rating = require('../models/Rating');
const User = require('../models/User');
const Trade = require('../models/Trade');
const logToFile = require('../utils/logger');

// Add a new user rating
const addUserRating = async (req, res) => {
    try {

        const { rated_user_id, trade_id, message, stars } = req.body;
        const rater_user_id = req.user.userId; // From auth middleware

        logToFile("rater_user_id: " + rater_user_id);

        logToFile("entrie req; " + JSON.stringify(req.user));


        // Validate required fields
        if (!rated_user_id || !trade_id || !stars) {
            return res.status(400).json({
                error: 'Wymagane pola: rated_user_id, trade_id, stars'
            });
        }

        // Validate stars range
        if (stars < 1 || stars > 5) {
            return res.status(400).json({
                error: 'Ocena musi być w zakresie od 1 do 5 gwiazdek'
            });
        }

        // Check if rated user exists
        const ratedUser = await User.findById(rated_user_id);

        // Check if rater user exists
        const raterUser = await User.findById(rater_user_id);

        if (!ratedUser) {
            return res.status(404).json({
                error: 'Oceniany użytkownik nie istnieje'
            });
        }

        if (!raterUser) {
            return res.status(404).json({
                error: 'Użytkownik nie istnieje'
            });
        }

        // Check if trade exists and user is part of it
        const trade = await Trade.findById(trade_id);
        if (!trade) {
            return res.status(404).json({
                error: 'Wymiana nie istnieje'
            });
        }

        // Verify that the user is part of this trade
        const isPartOfTrade = trade.user1_id.toString() === rater_user_id ||
            trade.user2_id.toString() === rater_user_id;

        if (!isPartOfTrade) {
            return res.status(403).json({
                error: 'Nie możesz ocenić tej wymiany - nie jesteś jej uczestnikiem'
            });
        }

        // Check if user already rated this trade
        const existingRating = await Rating.findOne({
            user_id: rater_user_id,
            trade_id: trade_id
        });

        if (existingRating) {
            return res.status(400).json({
                error: 'Już oceniłeś tę wymianę'
            });
        }

        // Prevent self-rating
        if (rater_user_id === rated_user_id) {
            return res.status(400).json({
                error: 'Nie możesz ocenić samego siebie'
            });
        }

        // Create new rating
        const newRating = new Rating({
            user_id: rater_user_id,
            trade_id: trade_id,
            rated_user_id: rated_user_id, // We need to add this field to the model
            message: message || '',
            stars: stars
        });

        await newRating.save();

        // Populate the rating with user info before sending response
        await newRating.populate('user_id', 'login');

        res.status(201).json({
            message: 'Ocena została dodana pomyślnie',
            rating: newRating
        });

    } catch (error) {
        console.error('Błąd podczas dodawania oceny:', error);
        res.status(500).json({
            error: 'Błąd serwera podczas dodawania oceny'
        });
    }
};

// Get ratings for a specific user
const getUserRatings = async (req, res) => {
    try {

        const userId = req.params.userId;

        const user = await User.findOne({ username: userId }).select('username');
        if (!user) {
            return res.status(404).json({
                error: 'Użytkownik nie znaleziony'
            });
        }

        // Find all ratings for this user
        const ratings = await Rating.find({ rated_user_id: user })
            .populate('user_id', 'login')
            .populate('trade_id', 'status')
            .sort({ createdAt: -1 });

        res.json(ratings);

    } catch (error) {
        console.error('Błąd podczas pobierania ocen: ', error);
        res.status(500).json({
            error: 'Błąd serwera podczas pobierania ocen'
        });
    }
};

// Delete a user rating (only by the person who created it or admin)
const deleteUserRating = async (req, res) => {
    try {
        const { ratingId } = req.params;
        const userId = req.user.userId;

        // Find the rating
        const rating = await Rating.findById(ratingId);
        if (!rating) {
            return res.status(404).json({
                error: 'Ocena nie istnieje'
            });
        }

        // Get the user from the database to check admin status
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                error: 'Użytkownik nie znaleziony'
            });
        }

        const isAdmin = user.is_admin;

        // Check if user has permission to delete (owner or admin)
        if (rating.user_id.toString() !== userId && !isAdmin) {
            return res.status(403).json({
                error: 'Nie masz uprawnień do usunięcia tej oceny'
            });
        }

        await Rating.findByIdAndDelete(ratingId);

        res.json({
            message: 'Ocena została usunięta pomyślnie'
        });

    } catch (error) {
        console.error('Błąd podczas usuwania oceny:', error);
        res.status(500).json({
            error: 'Błąd serwera podczas usuwania oceny'
        });
    }
};


module.exports = {
    addUserRating,
    getUserRatings,
    deleteUserRating
};