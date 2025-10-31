const express = require('express');
const router = express.Router();
const { listarClientesPorUnidade } = require('../controllers/clientesController');

router.get('/clientes/unidade/:idUnidade', listarClientesPorUnidade);

module.exports = router;
