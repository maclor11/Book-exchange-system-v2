const User = require('../models/User');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ścieżka do folderu uploads z .env lub domyślna
const UPLOADS_PATH = process.env.UPLOADS_PATH || path.join(__dirname, '../../uploads');

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(UPLOADS_PATH, 'profile-pictures');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, req.user.userId + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Tylko pliki obrazowe są dozwolone'));
        }
    }
});

exports.getCurrentUserLogin = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('username');
        res.json({ login: user.username });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.getUserProfileById = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findOne({ username: userId }).select('username');

        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }

        res.json({ login: user.username });
    } catch (error) {
        console.error('Błąd podczas pobierania profilu użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.getCurrentUserProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('profilePicturePath');
        res.json({ profilePicturePath: user.profilePicturePath });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.getUserProfilePictureById = async (req, res) => {
    const userId = req.params.userId;

    try {
        const user = await User.findOne({ username: userId }).select('profilePicturePath');

        if (!user || !user.profilePicturePath) {
            return res.status(404).json({ error: 'Zdjęcie profilowe nie znalezione' });
        }

        res.json({ profilePicturePath: user.profilePicturePath });
    } catch (error) {
        console.error('Błąd podczas pobierania zdjęcia profilowego:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.updateCurrentUserLogin = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ error: 'Login jest wymagany' });
        }

        // Sprawdź czy login nie jest już zajęty
        const existingUser = await User.findOne({ username, _id: { $ne: req.user.userId } });
        if (existingUser) {
            return res.status(400).json({ error: 'Ten login jest już zajęty' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { username },
            { new: true }
        ).select('username');

        res.json({ message: 'Login zaktualizowany', username: updatedUser.username });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.updateCurrentUserProfilePicture = [
    upload.single('profilePicture'),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'Plik zdjęcia jest wymagany' });
            }

            // Usuń stare zdjęcie profilowe jeśli istnieje
            const user = await User.findById(req.user.userId);
            if (user.profilePicturePath) {
                const oldFilePath = path.join(UPLOADS_PATH, user.profilePicturePath);
                if (fs.existsSync(oldFilePath)) {
                    fs.unlinkSync(oldFilePath);
                }
            }

            // Zapisz relatywną ścieżkę do nowego zdjęcia (względem folderu uploads)
            const profilePicturePath = path.relative(UPLOADS_PATH, req.file.path);

            const updatedUser = await User.findByIdAndUpdate(
                req.user.userId,
                { profilePicturePath },
                { new: true }
            ).select('profilePicturePath');

            res.json({
                message: 'Zdjęcie profilowe zaktualizowane',
                profilePicturePath: updatedUser.profilePicturePath
            });
        } catch (error) {
            console.error('Błąd przy aktualizacji zdjęcia profilowego:', error);
            res.status(500).json({ error: 'Błąd serwera' });
        }
    }
];

exports.updateCurrentUserPassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ error: 'Stare i nowe hasło są wymagane' });
        }

        //if (newPassword.length < 6) {
        //    return res.status(400).json({ error: 'Nowe hasło musi mieć co najmniej 6 znaków' });
        //}

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Nieprawidłowe stare hasło' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ message: 'Hasło zostało zaktualizowane' });
    } catch (error) {
        res.status(500).json({ error: 'Błąd serwera' });
    }
};