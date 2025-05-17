const User = require('../models/User');
const UserBooks = require('../models/UserBook');

exports.getOtherUsers = async (currentUserId) => {
    return await User.find({ _id: { $ne: currentUserId } }).select('_id');
};

exports.getBooksByUserIds = async (userIds) => {
    return await UserBook.find({ user_id: { $in: userIds } }).populate('book_id');
};

exports.browseBooksByTitle = (books, title) => {
    const regex = new RegExp(title, 'i');
    return books.filter(b => b.book_id && regex.test(b.book_id.title));
};

exports.getAllBooks = async (req, res) => {
    try {
        const { title, condition, cover_type } = req.query;
        const otherUsers = await this.getOtherUsers(req.user.userId);
        const books = await this.getBooksByUserIds(otherUsers.map(u => u._id));
        const filteredBooks = this.filterBooks(books, { title, condition, cover_type });
        res.json(filteredBooks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'B³¹d serwera' });
    }
};


exports.filterBooks = (books, filters) => {
    const { title, condition, cover_type } = filters;

    return books.filter(b => {
        const book = b.book_id;
        if (!book) return false;

        const matchTitle = title ? new RegExp(title, 'i').test(book.title) : true;
        const matchCondition = condition ? book.condition === condition : true;
        const matchCover = cover_type ? book.cover_type === cover_type : true;

        return matchTitle && matchCondition && matchCover;
    });
};

