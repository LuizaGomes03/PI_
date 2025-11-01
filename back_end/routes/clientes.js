const express = require('express');
const router = express.Router();
const {
  listarClientesPorUnidade,
  cadastrarCliente,
  atualizarCliente,
  removerCliente
} = require('../controllers/clientesController');

router.get('/unidade/:unidadeId', listarClientesPorUnidade);

router.post('/', cadastrarCliente);

router.put('/:id', atualizarCliente);

router.delete('/:id', removerCliente);

module.exports = router;