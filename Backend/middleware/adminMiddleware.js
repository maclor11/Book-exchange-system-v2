const User = require('../models/User');

// Sprawdzanie uprawnień administratora
module.exports = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.userId);
        
        if (!user || !user.is_admin) {
            return res.status(403).json({ error: 'Brak uprawnień administratora' });
        }
        
        next();
    } catch (error) {
        console.error('Błąd middleware administratora:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};