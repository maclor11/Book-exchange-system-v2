const Book = require('../models/Book');
const UserBook = require('../models/UserBook');

// Pobierz wszystkie książki użytkownika
exports.getUserBooks = async (req, res) => {
    try {
        // Znajdź wszystkie powiązania użytkownik-książka dla danego użytkownika
        const userBooks = await UserBook.find({ user_id: req.user.userId })
            .populate('book_id')
            .sort({ owned_date: -1 });
        
        // Przygotuj dane do zwrócenia
        const books = userBooks.map(userBook => {
            return {
                id: userBook.book_id._id,
                title: userBook.book_id.title,
                author: userBook.book_id.author,
                condition: userBook.book_id.condition,
                cover_type: userBook.book_id.cover_type,
                owned_date: userBook.owned_date
            };
        });
        
        res.json(books);
    } catch (error) {
        console.error('Błąd podczas pobierania książek użytkownika:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Dodaj książkę do półki użytkownika
exports.addBookToShelf = async (req, res) => {
    try {
        const { title, author, condition, cover_type } = req.body;
        
        // Sprawdź, czy książka już istnieje w bazie
        let book = await Book.findOne({ 
            title: new RegExp(`^${title}$`, 'i'), 
            author: new RegExp(`^${author}$`, 'i')
        });
        
        // Jeśli książka nie istnieje, dodaj ją
        if (!book) {
            book = new Book({
                title,
                author,
                condition,
                cover_type
            });
            await book.save();
        }
        
        // Sprawdź, czy użytkownik już posiada tę książkę
        const existingUserBook = await UserBook.findOne({
            user_id: req.user.userId,
            book_id: book._id
        });
        
        if (existingUserBook) {
            return res.status(400).json({ error: 'Ta książka jest już na Twojej półce' });
        }
        
        // Dodaj książkę do półki użytkownika
        const userBook = new UserBook({
            user_id: req.user.userId,
            book_id: book._id
        });
        await userBook.save();
        
        res.status(201).json({ message: 'Książka została dodana do Twojej półki' });
    } catch (error) {
        console.error('Błąd podczas dodawania książki:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

// Usuń książkę z półki użytkownika
exports.removeBookFromShelf = async (req, res) => {
    try {
        const { bookId } = req.params;
        
        // Znajdź i usuń powiązanie użytkownik-książka
        const result = await UserBook.findOneAndDelete({ 
            user_id: req.user.userId,
            book_id: bookId
        });
        
        if (!result) {
            return res.status(404).json({ error: 'Książka nie została znaleziona na Twojej półce' });
        }
        
        res.json({ message: 'Książka została usunięta z Twojej półki' });
    } catch (error) {
        console.error('Błąd podczas usuwania książki:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        // Znajdź wszystkie powiązania użytkownik-książka
        const userBooks = await UserBook.find()
            .populate('book_id')
            .populate('user_id', 'username')
            .sort({ owned_date: -1 });
        
        // Przygotuj dane do zwrócenia
        const books = userBooks.map(userBook => {
            return {
                id: userBook.book_id._id,
                title: userBook.book_id.title,
                author: userBook.book_id.author,
                condition: userBook.book_id.condition,
                cover_type: userBook.book_id.cover_type,
                owned_date: userBook.owned_date,
                owner_username: userBook.user_id.username
            };
        });
        
        res.json(books);
    } catch (error) {
        console.error('Błąd podczas pobierania wszystkich książek:', error);
        res.status(500).json({ error: 'Błąd serwera' });
    }
};