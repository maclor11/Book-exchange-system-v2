const User = require('../models/User');
const UserBook = require('../models/UserBook');
const mongoose = require('mongoose');

// Pobieranie listy użytkowników z paginacją i wyszukiwaniem
exports.getUsers = async (req, res) => {
    console.log("getUsers wywołane!");
    try {
        const search = req.query.search || '';
        const searchPattern = new RegExp(search, 'i');
        const query = search
            ? { username: { $regex: searchPattern } }
            : {};
        // Pobierz użytkowników z paginacją
        const users = await User.find(query).select('-password');

        res.json({
            users
        });
    } catch (error) {
        console.error('Błąd przy pobieraniu użytkowników:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Pobieranie wszystkich użytkowników poza jednym wskazanym ID
exports.getOtherUsers = async (req, res) => {
    try {
        // Sprawdź poprawność id
        const excludedId = req.user.id;
        if (!mongoose.Types.ObjectId.isValid(excludedId)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }
        const users = await User.find({ id: { $ne: excludedId } }).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Błąd przy pobieraniu użytkowników:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.getBooksByOtherUsers = async (req, res) => {
    try {
        const excludedId = req.user.id;

        if (!mongoose.Types.ObjectId.isValid(excludedId)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }

        const userBooks = await UserBook.find({ id: { $ne: excludedId } })
            .populate('book_id')
            .select('book_id user_id');

        // Grupowanie: user_id => [książki]
        const booksByUser = {};
        userBooks.forEach(entry => {
            const uid = entry.user_id.toString();
            if (!booksByUser[uid]) booksByUser[uid] = [];
            booksByUser[uid].push(entry.book_id);
        });

        res.json(booksByUser);

    } catch (error) {
        console.error('Błąd przy pobieraniu książek innych użytkowników:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};


exports.getAllBooks = async (req, res) => {
    console.log("getAllBooks wywołane!");
    try {
        const userBooks = await UserBook.find()
            .populate('book_id')
            .select('book_id user_id');

        // Grupowanie: user_id => [książki]
        const booksByUser = {};
        userBooks.forEach(entry => {
            const uid = entry.user_id.toString();
            if (!booksByUser[uid]) booksByUser[uid] = [];
            booksByUser[uid].push(entry.book_id);
        });

        res.json(booksByUser);

    } catch (error) {
        console.error('Błąd przy pobieraniu książek innych użytkowników:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

