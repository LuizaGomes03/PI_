const db = require('../config/db'); // Supondo que você tenha uma configuração de banco de dados aqui

// Controlador para pegar todos os giftcards
exports.getAllGiftcards = (req, res) => {
    db.query('SELECT * FROM giftcard', (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.json(result); // Retorna os giftcards como resposta JSON
    });
};
