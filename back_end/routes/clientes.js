import express from 'express';
const router = express.Router();
import {
  listarClientesPorUnidade,
  cadastrarCliente,
  atualizarCliente,
  removerCliente
} from '../controllers/clientesController.js'; // Mantém o .js obrigatório no ESM

router.get('/unidade/:unidadeId', listarClientesPorUnidade);

router.post('/', cadastrarCliente);

router.put('/:id', atualizarCliente);

router.delete('/:id', removerCliente);

export default router;