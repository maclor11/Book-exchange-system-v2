const Trade = require('../models/Trade');
const TradeBook = require('../models/TradeBook');
const UserBook = require('../models/UserBook');
const User = require('../models/User');
const Book = require('../models/Book');

// Zablokuj ksi��ki po akceptacji
const lockBooksForTrade = async (tradeId) => {
    const tradeBooks = await TradeBook.find({ trade_id: tradeId });
    
    for (const tradeBook of tradeBooks) {
        await UserBook.updateOne(
            { 
                user_id: tradeBook.owner_id,
                book_id: tradeBook.book_id 
            },
            { locked_by_trade: tradeId }
        );
    }
};

// Odblokuj ksi��ki
const unlockBooksForTrade = async (tradeId) => {
    await UserBook.updateMany(
        { locked_by_trade: tradeId },
        { locked_by_trade: null }
    );
};

// Funkcja sprawdzaj�c� dost�pno�� ksi��ek
const checkBookAvailability = async (bookIds, excludeTradeId = null) => {
    const userBooks = await UserBook.find({
        book_id: { $in: bookIds }
    }).populate('locked_by_trade');

    const unavailableBooks = [];
    
    for (const userBook of userBooks) {
        // Ksi��ka jest niedost�pna je�li jest zablokowana przez inn� wymian�
        if (userBook.locked_by_trade && 
            userBook.locked_by_trade._id.toString() !== excludeTradeId?.toString()) {
            unavailableBooks.push({
                bookId: userBook.book_id,
                lockedByTrade: userBook.locked_by_trade._id
            });
        }
    }
    
    return unavailableBooks;
};

// Utw�rz now� wymian�
exports.createTrade = async (req, res) => {
    try {
        const { user2_id, user1_books, user2_books } = req.body;
        const user1_id = req.user.userId;

        // Sprawd� czy drugi u�ytkownik istnieje
        const user2 = await User.findOne({ username: user2_id });
        if (!user2) {
            return res.status(404).json({ error: 'U�ytkownik nie znaleziony' });
        }

        // Sprawd� czy nie pr�buje utworzy� wymiany sam ze sob�
        if (user1_id === user2._id.toString()) {
            return res.status(400).json({ error: 'Nie mo�esz utworzy� wymiany sam ze sob�' });
        }

        // Sprawd� czy wszystkie ksi��ki u�ytkownika 1 nale�� do niego
        if (user1_books && user1_books.length > 0) {
            const user1BookCheck = await UserBook.find({
                user_id: user1_id,
                book_id: { $in: user1_books }
            });
            
            if (user1BookCheck.length !== user1_books.length) {
                return res.status(400).json({ error: 'Niekt�re z wybranych ksi��ek nie nale�� do Ciebie' });
            }
        }

        // Sprawd� czy wszystkie ksi��ki u�ytkownika 2 nale�� do niego
        if (user2_books && user2_books.length > 0) {
            const user2BookCheck = await UserBook.find({
                user_id: user2._id,
                book_id: { $in: user2_books }
            });
            
            if (user2BookCheck.length !== user2_books.length) {
                return res.status(400).json({ error: 'Niekt�re z wybranych ksi��ek nie nale�� do drugiego u�ytkownika' });
            }
        }

        // Utw�rz now� wymian�
        const trade = new Trade({
			user1_id: user1_id,
			user2_id: user2._id,
			status: 'pending',
			pending_user_id: user2._id  // pocz�tkowo czeka user2 (odbiorca)
		});

        await trade.save();

        // Dodaj ksi��ki u�ytkownika 1 do wymiany
        if (user1_books && user1_books.length > 0) {
            const user1TradeBooks = user1_books.map(bookId => ({
                trade_id: trade._id,
                book_id: bookId,
                owner_id: user1_id
            }));
            await TradeBook.insertMany(user1TradeBooks);
        }

        // Dodaj ksi��ki u�ytkownika 2 do wymiany
        if (user2_books && user2_books.length > 0) {
            const user2TradeBooks = user2_books.map(bookId => ({
                trade_id: trade._id,
                book_id: bookId,
                owner_id: user2._id
            }));
            await TradeBook.insertMany(user2TradeBooks);
        }

        res.status(201).json({ 
            message: 'Wymiana zosta�a utworzona', 
            tradeId: trade._id 
        });
    } catch (error) {
        console.error('B��d podczas tworzenia wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Pobierz wszystkie wymiany u�ytkownika (wys�ane i otrzymane)
exports.getUserTrades = async (req, res) => {
    try {
        const userId = req.user.userId;

        const trades = await Trade.find({
            $or: [
                { user1_id: userId },
                { user2_id: userId }
            ]
        })
        .populate('user1_id', 'username')
        .populate('user2_id', 'username')
        .sort({ _id: -1 });

        // Poprawka: Zdefiniuj tradeIds na podstawie pobranych trades
        const tradeIds = trades.map(trade => trade._id);

        const tradesWithBooks = await Promise.all(trades.map(async (trade) => {
            const tradeBooks = await TradeBook.find({ trade_id: trade._id })
                .populate({
                    path: 'book_id',
                    model: 'Book'
                })
                .populate({
                    path: 'owner_id',
                    model: 'User',
                    select: 'username'
                });

            // Pobierz informacje o zablokowaniu ksi��ek
            const bookIds = tradeBooks.map(tb => tb.book_id._id);
            const userBooks = await UserBook.find({ book_id: { $in: bookIds } })
                .populate('locked_by_trade');

            // Stw�rz map� blokad ksi��ek
            const bookLockMap = {};
            userBooks.forEach(ub => {
                bookLockMap[ub.book_id.toString()] = {
                    is_locked: !!ub.locked_by_trade,
                    locked_by_trade_id: ub.locked_by_trade?._id
                };
            });

            const user1Books = tradeBooks
                .filter(tb => tb.owner_id._id.toString() === trade.user1_id._id.toString())
                .map(tb => ({
                    id: tb.book_id._id,
                    title: tb.book_id.title,
                    author: tb.book_id.author,
                    condition: tb.book_id.condition,
                    cover_type: tb.book_id.cover_type,
                    ...bookLockMap[tb.book_id._id.toString()] // Dodaj informacje o zablokowaniu
                }));

            const user2Books = tradeBooks
                .filter(tb => tb.owner_id._id.toString() === trade.user2_id._id.toString())
                .map(tb => ({
                    id: tb.book_id._id,
                    title: tb.book_id.title,
                    author: tb.book_id.author,
                    condition: tb.book_id.condition,
                    cover_type: tb.book_id.cover_type,
                    ...bookLockMap[tb.book_id._id.toString()] // Dodaj informacje o zablokowaniu
                }));

            return {
                id: trade._id,
                user1: {
                    id: trade.user1_id._id,
                    username: trade.user1_id.username,
                    books: user1Books
                },
                user2: {
                    id: trade.user2_id._id,
                    username: trade.user2_id.username,
                    books: user2Books
                },
                status: trade.status,
                reviewed: trade.reviewed,
                isInitiator: trade.user1_id._id.toString() === userId,
                pendingUserId: trade.pending_user_id,
                awaitingMyResponse: trade.pending_user_id?.toString() === userId,
                awaitingTheirResponse: trade.pending_user_id?.toString() !== userId,
                user1ConfirmedCompletion: trade.user1_confirmed_completion,
                user2ConfirmedCompletion: trade.user2_confirmed_completion,
                myConfirmationStatus: trade.user1_id._id.toString() === userId 
                    ? trade.user1_confirmed_completion 
                    : trade.user2_confirmed_completion,
                partnerConfirmationStatus: trade.user1_id._id.toString() === userId 
                    ? trade.user2_confirmed_completion 
                    : trade.user1_confirmed_completion,
                completionDate: trade.completion_date
            };
        }));

        res.json(tradesWithBooks);
    } catch (error) {
        console.error('B��d podczas pobierania wymian:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Pobierz szczeg�y konkretnej wymiany
exports.getTradeDetails = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId)
            .populate('user1_id', 'username')
            .populate('user2_id', 'username');

        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        // Sprawd� czy u�ytkownik ma dost�p do tej wymiany
        if (trade.user1_id._id.toString() !== userId && trade.user2_id._id.toString() !== userId) {
            return res.status(403).json({ error: 'Brak dost�pu do tej wymiany' });
        }

        const tradeBooks = await TradeBook.find({ trade_id: tradeId })
            .populate('book_id')
            .populate('owner_id', 'username');

        const user1Books = tradeBooks
            .filter(tb => tb.owner_id._id.toString() === trade.user1_id._id.toString())
            .map(tb => ({
                id: tb.book_id._id,
                title: tb.book_id.title,
                author: tb.book_id.author,
                condition: tb.book_id.condition,
                cover_type: tb.book_id.cover_type
            }));

        const user2Books = tradeBooks
            .filter(tb => tb.owner_id._id.toString() === trade.user2_id._id.toString())
            .map(tb => ({
                id: tb.book_id._id,
                title: tb.book_id.title,
                author: tb.book_id.author,
                condition: tb.book_id.condition,
                cover_type: tb.book_id.cover_type
            }));

        const tradeDetails = {
            id: trade._id,
            user1: {
                id: trade.user1_id._id,
                username: trade.user1_id.username,
                books: user1Books
            },
            user2: {
                id: trade.user2_id._id,
                username: trade.user2_id.username,
                books: user2Books
            },
            status: trade.status,
            reviewed: trade.reviewed,
            isInitiator: trade.user1_id._id.toString() === userId,
			pendingUserId: trade.pending_user_id,
			awaitingMyResponse: trade.pending_user_id?.toString() === userId,
			awaitingTheirResponse: trade.pending_user_id?.toString() !== userId
        };

        res.json(tradeDetails);
    } catch (error) {
        console.error('B��d podczas pobierania szczeg��w wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Zmodyfikuj wymian� (kontroferta)
exports.modifyTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { user1_books, user2_books } = req.body;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        // Sprawd� czy u�ytkownik ma dost�p do tej wymiany
        if (trade.user1_id.toString() !== userId && trade.user2_id.toString() !== userId) {
            return res.status(403).json({ error: 'Brak dost�pu do tej wymiany' });
        }


        // Sprawd� czy wymiana mo�e by� modyfikowana
		if (trade.status === 'completed' || trade.status === 'rejected' || trade.status === 'cancelled') {
			return res.status(400).json({ error: 'Nie mo�na modyfikowa� zako�czonej wymiany' });
		}

        // Okre�l kto jest user1 a kto user2 w kontek�cie aktualnej sesji
        const isCurrentUserUser1 = trade.user1_id.toString() === userId;
        
        // Sprawd� prawid�owo�� ksi��ek - u�ytkownik mo�e modyfikowa� tylko swoje ksi��ki
        if (user1_books && user1_books.length > 0) {
            const user1BookCheck = await UserBook.find({
                user_id: trade.user1_id,
                book_id: { $in: user1_books }
            });
            
            if (user1BookCheck.length !== user1_books.length) {
                return res.status(400).json({ error: 'Niekt�re ksi��ki nie nale�� do pierwszego u�ytkownika' });
            }
        }

        if (user2_books && user2_books.length > 0) {
            const user2BookCheck = await UserBook.find({
                user_id: trade.user2_id,
                book_id: { $in: user2_books }
            });
            
            if (user2BookCheck.length !== user2_books.length) {
                return res.status(400).json({ error: 'Niekt�re ksi��ki nie nale�� do drugiego u�ytkownika' });
            }
        }

        // Je�li wymiana by�a zaakceptowana, odblokuj ksi��ki
        if (trade.status === 'accepted') {
            await unlockBooksForTrade(tradeId);
        }

        // Usu� stare ksi��ki z wymiany
        await TradeBook.deleteMany({ trade_id: tradeId });

        // Dodaj nowe ksi��ki u�ytkownika 1
        if (user1_books && user1_books.length > 0) {
            const user1TradeBooks = user1_books.map(bookId => ({
                trade_id: tradeId,
                book_id: bookId,
                owner_id: trade.user1_id
            }));
            await TradeBook.insertMany(user1TradeBooks);
        }

        // Dodaj nowe ksi��ki u�ytkownika 2
        if (user2_books && user2_books.length > 0) {
            const user2TradeBooks = user2_books.map(bookId => ({
                trade_id: tradeId,
                book_id: bookId,
                owner_id: trade.user2_id
            }));
            await TradeBook.insertMany(user2TradeBooks);
        }

        const currentUserId = userId;
        const newPendingUserId = trade.user1_id.toString() === currentUserId 
            ? trade.user2_id 
            : trade.user1_id;

        // Ustaw status z powrotem na pending i zmie� kierunek
        trade.status = 'pending';
        trade.reviewed = false;
        trade.pending_user_id = newPendingUserId;
        await trade.save();

        res.json({ message: 'Kontroferta zosta�a z�o�ona' });
    } catch (error) {
        console.error('B��d podczas modyfikacji wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Zaakceptuj wymian�
exports.acceptTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId)
            .populate('user1_id', 'username')
            .populate('user2_id', 'username');

        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie zosta�a znaleziona' });
        }

        // Sprawd� czy u�ytkownik mo�e akceptowa� t� wymian�
        if (trade.pending_user_id.toString() !== userId.toString()) {
            return res.status(403).json({ error: 'Nie mo�esz akceptowa� tej wymiany' });
        }

        if (trade.status !== 'pending') {
            return res.status(400).json({ error: 'Ta wymiana nie mo�e by� ju� akceptowana' });
        }

        // Pobierz wszystkie ksi��ki z wymiany
        const tradeBooks = await TradeBook.find({ trade_id: tradeId });
        const allBookIds = tradeBooks.map(tb => tb.book_id);

        // Sprawd� dost�pno�� ksi��ek (wykluczaj�c obecn� wymian�)
        const unavailableBooks = await checkBookAvailability(allBookIds, tradeId);
        
        if (unavailableBooks.length > 0) {
            return res.status(400).json({ 
                error: 'Niekt�re ksi��ki w tej wymianie s� ju� niedost�pne. Wymiana nie mo�e by� zaakceptowana.',
                unavailableBooks: unavailableBooks
            });
        }

        // Zablokuj wszystkie ksi��ki w wymianie
        await UserBook.updateMany(
            { book_id: { $in: allBookIds } },
            { locked_by_trade: tradeId }
        );

        // Zaktualizuj status wymiany
        trade.status = 'accepted';
        await trade.save();

        res.json({ 
            message: 'Wymiana zosta�a zaakceptowana',
            trade: trade
        });

    } catch (error) {
        console.error('B��d podczas akceptacji wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Odrzu� wymian�
exports.rejectTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        // Sprawd� czy u�ytkownik ma dost�p do tej wymiany
        if (trade.user1_id.toString() !== userId && trade.user2_id.toString() !== userId) {
            return res.status(403).json({ error: 'Brak dost�pu do tej wymiany' });
        }

        if (trade.status === 'completed' || trade.status === 'rejected') {
            return res.status(400).json({ error: 'Wymiana zosta�a ju� zako�czona' });
        }

        trade.status = 'rejected';
        await trade.save();

        res.json({ message: 'Wymiana zosta�a odrzucona' });
    } catch (error) {
        console.error('B��d podczas odrzucania wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Anulowanie wymiany
exports.cancelTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        if (trade.user1_id.toString() !== userId && trade.user2_id.toString() !== userId) {
            return res.status(403).json({ error: 'Brak dost�pu do tej wymiany' });
        }

        if (trade.status !== 'accepted') {
            return res.status(400).json({ error: 'Mo�na anulowa� tylko zaakceptowane wymiany' });
        }

        // Odblokuj ksi��ki
        await unlockBooksForTrade(tradeId);

        trade.status = 'cancelled';
        await trade.save();

        res.json({ message: 'Wymiana zosta�a anulowana, ksi��ki s� ponownie dost�pne' });
    } catch (error) {
        console.error('B��d podczas anulowania wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Oznacz wymian� jako uko�czon�
exports.completeTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        if (trade.user1_id.toString() !== userId && trade.user2_id.toString() !== userId) {
            return res.status(403).json({ error: 'Brak dost�pu do tej wymiany' });
        }

        if (trade.status !== 'accepted') {
            return res.status(400).json({ error: 'Tylko zaakceptowane wymiany mog� by� uko�czone' });
        }

        // Okre�l kt�ry u�ytkownik potwierdza uko�czenie
        const isUser1 = trade.user1_id.toString() === userId;
        
        if (isUser1) {
            if (trade.user1_confirmed_completion) {
                return res.status(400).json({ error: 'Ju� potwierdzi�e� uko�czenie tej wymiany' });
            }
            trade.user1_confirmed_completion = true;
        } else {
            if (trade.user2_confirmed_completion) {
                return res.status(400).json({ error: 'Ju� potwierdzi�e� uko�czenie tej wymiany' });
            }
            trade.user2_confirmed_completion = true;
        }

        // Sprawd� czy obie strony potwierdzi�y uko�czenie
        if (trade.user1_confirmed_completion && trade.user2_confirmed_completion) {
            // Obie strony potwierdzi�y - usu� ksi��ki z p�ek
            const tradeBooks = await TradeBook.find({ trade_id: tradeId });

            for (const tradeBook of tradeBooks) {
                await UserBook.findOneAndDelete({
                    user_id: tradeBook.owner_id,
                    book_id: tradeBook.book_id
                });
            }

            trade.status = 'completed';
            trade.completion_date = new Date();
        }

        await trade.save();

        const message = trade.status === 'completed' 
            ? 'Wymiana zosta�a uko�czona! Ksi��ki zosta�y usuni�te z p�ek obu u�ytkownik�w.'
            : 'Twoje potwierdzenie zosta�o zapisane. Oczekiwanie na potwierdzenie drugiej strony.';

        res.json({ 
            message,
            bothConfirmed: trade.user1_confirmed_completion && trade.user2_confirmed_completion,
            isCompleted: trade.status === 'completed'
        });
    } catch (error) {
        console.error('B��d podczas ko�czenia wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};

// Usu� wymian� (tylko je�li jest pending i u�ytkownik jest inicjatorem)
exports.deleteTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const userId = req.user.userId;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ error: 'Wymiana nie znaleziona' });
        }

        // Tylko inicjator mo�e usun�� wymian�
        if (trade.user1_id.toString() !== userId) {
            return res.status(403).json({ error: 'Tylko inicjator mo�e usun�� wymian�' });
        }

        // Mo�na usun�� tylko pending wymiany
        if (trade.status !== 'pending') {
            return res.status(400).json({ error: 'Mo�na usun�� tylko oczekuj�ce wymiany' });
        }

        // Usu� ksi��ki powi�zane z wymian�
        await TradeBook.deleteMany({ trade_id: tradeId });

        // Usu� wymian�
        await Trade.findByIdAndDelete(tradeId);

        res.json({ message: 'Wymiana zosta�a usuni�ta' });
    } catch (error) {
        console.error('B��d podczas usuwania wymiany:', error);
        res.status(500).json({ error: 'B��d serwera' });
    }
};