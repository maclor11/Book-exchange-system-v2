const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
    createTrade,
    getUserTrades,
    getTradeDetails,
    modifyTrade,
    acceptTrade,
    rejectTrade,
    completeTrade,
    deleteTrade,
	cancelTrade
} = require('../controllers/tradeController');

// Wszystkie trasy wymagaj¹ uwierzytelnienia
router.use(authMiddleware);

// POST /api/user/trades - Utwórz now¹ wymianê
router.post('/trades', createTrade);

// GET /api/user/trades - Pobierz wszystkie wymiany u¿ytkownika
router.get('/trades', getUserTrades);

// GET /api/user/trades/:tradeId - Pobierz szczegó³y konkretnej wymiany
router.get('/trades/:tradeId', getTradeDetails);

// PUT /api/user/trades/:tradeId - Zmodyfikuj wymianê (kontroferta)
router.put('/trades/:tradeId', modifyTrade);

// PUT /api/user/trades/:tradeId/accept - Zaakceptuj wymianê
router.put('/trades/:tradeId/accept', acceptTrade);

// PUT /api/user/trades/:tradeId/reject - Odrzuæ wymianê
router.put('/trades/:tradeId/reject', rejectTrade);

// PUT /api/user/trades/:tradeId/complete - Oznacz wymianê jako ukoñczon¹
router.put('/trades/:tradeId/complete', completeTrade);

// PUT /api/user/trades/:tradeId/cancel - Anuluj zaakceptowan¹ wymianê
router.put('/trades/:tradeId/cancel', cancelTrade);

// DELETE /api/user/trades/:tradeId - Usuñ wymianê
router.delete('/trades/:tradeId', deleteTrade);

module.exports = router;