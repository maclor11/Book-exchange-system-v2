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

// Wszystkie trasy wymagaj� uwierzytelnienia
router.use(authMiddleware);

// POST /api/user/trades - Utw�rz now� wymian�
router.post('/trades', createTrade);

// GET /api/user/trades - Pobierz wszystkie wymiany u�ytkownika
router.get('/trades', getUserTrades);

// GET /api/user/trades/:tradeId - Pobierz szczeg�y konkretnej wymiany
router.get('/trades/:tradeId', getTradeDetails);

// PUT /api/user/trades/:tradeId - Zmodyfikuj wymian� (kontroferta)
router.put('/trades/:tradeId', modifyTrade);

// PUT /api/user/trades/:tradeId/accept - Zaakceptuj wymian�
router.put('/trades/:tradeId/accept', acceptTrade);

// PUT /api/user/trades/:tradeId/reject - Odrzu� wymian�
router.put('/trades/:tradeId/reject', rejectTrade);

// PUT /api/user/trades/:tradeId/complete - Oznacz wymian� jako uko�czon�
router.put('/trades/:tradeId/complete', completeTrade);

// PUT /api/user/trades/:tradeId/cancel - Anuluj zaakceptowan� wymian�
router.put('/trades/:tradeId/cancel', cancelTrade);

// DELETE /api/user/trades/:tradeId - Usu� wymian�
router.delete('/trades/:tradeId', deleteTrade);

module.exports = router;