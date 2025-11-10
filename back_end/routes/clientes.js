import express from 'express';
const router = express.Router();
import {
  listarClientesPorUnidade,
  cadastrarCliente,
  atualizarCliente,
  removerCliente,
  listarAniversariantesDoDia
} from '../controllers/clientesController.js'; // Mantém o .js obrigatório no ESM

router.get('/unidade/:unidadeId', listarClientesPorUnidade);
router.post('/', cadastrarCliente);
router.put('/:id', atualizarCliente);
router.delete('/:id', removerCliente);
router.get('/aniversariantes/:unidadeId', listarAniversariantesDoDia);

export default router;