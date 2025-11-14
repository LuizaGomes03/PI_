import express from "express";
import {
  listarPrecos,
  getServicos,
  getPrecosDoServico
} from "../controllers/servicoController.js";

const router = express.Router();

// LISTA SERVIÇOS
router.get("/", getServicos);

// LISTA TODOS PREÇOS DE TODOS SERVIÇOS
router.get("/precos", listarPrecos);

// LISTA TEMPOS/PREÇOS DO SERVIÇO
router.get("/:servico_id/precos", getPrecosDoServico);

export default router;
