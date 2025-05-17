const User = require('../models/User');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Pobieranie listy użytkowników z paginacją i wyszukiwaniem
exports.getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Utwórz wzorzec wyszukiwania
        const searchPattern = new RegExp(search, 'i');
        const query = search 
            ? { username: { $regex: searchPattern } }
            : {};

        // Pobierz całkowitą liczbę użytkowników spełniających kryteria
        const total = await User.countDocuments(query);

        // Pobierz użytkowników z paginacją
        const users = await User.find(query)
            .select('username is_admin profilePicturePath')
            .skip(skip)
            .limit(limit)
            .sort({ username: 1 });

        res.json({
            users,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Błąd przy pobieraniu użytkowników:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Pobieranie konkretnego użytkownika
exports.getUserById = async (req, res) => {
    try {
        // Sprawdź poprawność id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }

        const user = await User.findById(req.params.id).select('-password');
        
        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Błąd przy pobieraniu użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Aktualizacja użytkownika
exports.updateUser = async (req, res) => {
    try {
        // Sprawdź poprawność id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }

        const { username, is_admin, password } = req.body;
        
        // Sprawdź czy użytkownik istnieje
        const userToUpdate = await User.findById(req.params.id);
        if (!userToUpdate) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        
        // Sprawdź czy login nie jest już zajęty (jeśli zmieniono)
        if (username && username !== userToUpdate.username) {
            const existingUser = await User.findOne({ 
                username, 
                _id: { $ne: req.params.id } 
            });
            
            if (existingUser) {
                return res.status(400).json({ error: 'Ten login jest już zajęty' });
            }
        }
        
        // Przygotuj obiekt z aktualizacjami
        const updates = {};
        if (username) updates.username = username;
        if (is_admin !== undefined) updates.is_admin = is_admin;
        
        // Aktualizuj użytkownika
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).select('-password');
        
        // Jeśli podano nowe hasło, zaktualizuj je osobno
        if (password) {
            userToUpdate.password = password;
            await userToUpdate.save();
        }
        
        res.json({
            message: 'Użytkownik zaktualizowany pomyślnie',
            user: updatedUser
        });
    } catch (error) {
        console.error('Błąd przy aktualizacji użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuwanie użytkownika
exports.deleteUser = async (req, res) => {
    try {
        // Sprawdź poprawność id
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Nieprawidłowy format ID użytkownika' });
        }

        // Zapobiegnij usunięciu własnego konta
        if (req.params.id === req.user.userId) {
            return res.status(400).json({ error: 'Nie można usunąć własnego konta' });
        }
        
        // Znajdź i usuń użytkownika
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        
        if (!deletedUser) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }
        
        res.json({ message: 'Użytkownik został usunięty pomyślnie' });
    } catch (error) {
        console.error('Błąd przy usuwaniu użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};