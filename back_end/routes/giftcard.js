const express = require('express');
const router = express.Router();
const giftcardController = require('../controllers/giftcardsController');

// Rota para obter todos os giftcards
router.get('/', giftcardController.getAllGiftcards);

module.exports = router;
