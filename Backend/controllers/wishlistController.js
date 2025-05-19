const Book = require('../models/Book');
const UserWishlist = require('../models/UserWishlist');

// Pobierz wszystkie ksi��ki z listy �ycze� u�ytkownika
exports.getUserWishlist = async (req, res) => {
    try {
        // Znajd� wszystkie powi�zania u�ytkownik-ksi��ka dla danego u�ytkownika
        const userWishlists = await UserWishlist.find({ user_id: req.user.userId })
            .populate('book_id')
            .sort({ owned_date: -1 });
        
        // Przygotuj dane do zwr�cenia
        const books = userWishlists.map(userWishlist => {
            return {
                id: userWishlist.book_id._id,
                title: userWishlist.book_id.title,
                author: userWishlist.book_id.author,
            };
        });
        
        res.json(books);
    } catch (error) {
        console.error('B��d podczas pobierania ksi��ek u�ytkownika:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Dodaj ksi��k� do listy �ycze� u�ytkownika
exports.addBookToWishlist = async (req, res) => {
    try {
        const { title, author } = req.body;
        
        // Sprawd�, czy ksi��ka ju� istnieje w bazie
        let book = await Book.findOne({ 
            title: new RegExp(`^${title}$`, 'i'), 
            author: new RegExp(`^${author}$`, 'i')
        });
        
        // Je�li ksi��ka nie istnieje, dodaj j�
        if (!book) {
            book = new Book({
                title,
                author
            });
            await book.save();
        }
        
        // Sprawd�, czy u�ytkownik ju� posiada t� ksi��k�
        const existingUserWishlist = await UserWishlist.findOne({
            user_id: req.user.userId,
            book_id: book._id
        });
        
        if (existingUserWishlist) {
            return res.status(400).json({ error: 'Ta ksi��ka jest ju� na Twojej li�cie �ycze�' });
        }
        
        // Dodaj ksi��k� do p�ki u�ytkownika
        const userWishlist = new UserWishlist({
            user_id: req.user.userId,
            book_id: book._id
        });
        await userWishlist.save();
        
        res.status(201).json({ message: 'Ksi��ka zosta�a dodana do Twojej listy �ycze�' });
    } catch (error) {
        console.error('B��d podczas dodawania ksi��ki:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Usu� ksi��k� z listy �ycze� u�ytkownika
exports.removeBookFromWishlist = async (req, res) => {
    try {
        const { bookId } = req.params;
        
        // Znajd� i usu� powi�zanie u�ytkownik-ksi��ka
        const result = await UserWishlist.findOneAndDelete({ 
            user_id: req.user.userId,
            book_id: bookId
        });
        
        if (!result) {
            return res.status(404).json({ error: 'Ksi��ka nie zosta�a znaleziona na Twojej li�cie �ycze�' });
        }
        
        res.json({ message: 'Ksi��ka zosta�a usuni�ta z Twojej listy �ycze�' });
    } catch (error) {
        console.error('B��d podczas usuwania ksi��ki:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};