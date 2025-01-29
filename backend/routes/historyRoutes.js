const express = require('express');
const router = express.Router();
const {
    getHistory,
    addHistory,
} = require('../controllers/historyController');

// 履歴取得
router.get('/history', getHistory);

// 履歴追加
router.post('/history', addHistory);

module.exports = router;
