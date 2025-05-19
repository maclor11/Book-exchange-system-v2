const Book = require('../models/Book');
const UserWishlist = require('../models/UserWishlist');

// Pobierz wszystkie ksi¹¿ki z listy ¿yczeñ u¿ytkownika
exports.getUserWishlist = async (req, res) => {
    try {
        // ZnajdŸ wszystkie powi¹zania u¿ytkownik-ksi¹¿ka dla danego u¿ytkownika
        const userWishlists = await UserWishlist.find({ user_id: req.user.userId })
            .populate('book_id')
            .sort({ owned_date: -1 });
        
        // Przygotuj dane do zwrócenia
        const books = userWishlists.map(userWishlist => {
            return {
                id: userWishlist.book_id._id,
                title: userWishlist.book_id.title,
                author: userWishlist.book_id.author,
            };
        });
        
        res.json(books);
    } catch (error) {
        console.error('B³¹d podczas pobierania ksi¹¿ek u¿ytkownika:', error);
        res.status(500).json({ error: 'B³¹d serwera' });
    }
};

// Dodaj ksi¹¿kê do listy ¿yczeñ u¿ytkownika
exports.addBookToWishlist = async (req, res) => {
    try {
        const { title, author } = req.body;
        
        // SprawdŸ, czy ksi¹¿ka ju¿ istnieje w bazie
        let book = await Book.findOne({ 
            title: new RegExp(`^${title}$`, 'i'), 
            author: new RegExp(`^${author}$`, 'i')
        });
        
        // Jeœli ksi¹¿ka nie istnieje, dodaj j¹
        if (!book) {
            book = new Book({
                title,
                author
            });
            await book.save();
        }
        
        // SprawdŸ, czy u¿ytkownik ju¿ posiada tê ksi¹¿kê
        const existingUserWishlist = await UserWishlist.findOne({
            user_id: req.user.userId,
            book_id: book._id
        });
        
        if (existingUserWishlist) {
            return res.status(400).json({ error: 'Ta ksi¹¿ka jest ju¿ na Twojej liœcie ¿yczeñ' });
        }
        
        // Dodaj ksi¹¿kê do pó³ki u¿ytkownika
        const userWishlist = new UserWishlist({
            user_id: req.user.userId,
            book_id: book._id
        });
        await userWishlist.save();
        
        res.status(201).json({ message: 'Ksi¹¿ka zosta³a dodana do Twojej listy ¿yczeñ' });
    } catch (error) {
        console.error('B³¹d podczas dodawania ksi¹¿ki:', error);
        res.status(500).json({ error: 'B³¹d serwera' });
    }
};

// Usuñ ksi¹¿kê z listy ¿yczeñ u¿ytkownika
exports.removeBookFromWishlist = async (req, res) => {
    try {
        const { bookId } = req.params;
        
        // ZnajdŸ i usuñ powi¹zanie u¿ytkownik-ksi¹¿ka
        const result = await UserWishlist.findOneAndDelete({ 
            user_id: req.user.userId,
            book_id: bookId
        });
        
        if (!result) {
            return res.status(404).json({ error: 'Ksi¹¿ka nie zosta³a znaleziona na Twojej liœcie ¿yczeñ' });
        }
        
        res.json({ message: 'Ksi¹¿ka zosta³a usuniêta z Twojej listy ¿yczeñ' });
    } catch (error) {
        console.error('B³¹d podczas usuwania ksi¹¿ki:', error);
        res.status(500).json({ error: 'B³¹d serwera' });
    }
};