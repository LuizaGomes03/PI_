import express from "express";
import {
  listarAtendimentos,
  criarAtendimento,
  iniciarAtendimento,
  encerrarAtendimento,
  getAtendimentosMensal,
  getHorariosDisponiveis,
  criarAgendamento
} from "../controllers/atendimentosController.js";

const router = express.Router();

router.get("/", listarAtendimentos);
router.post("/", criarAtendimento)
router.put("/:id/iniciar", iniciarAtendimento);
router.put("/:id/encerrar", encerrarAtendimento);
router.get("/mensal", getAtendimentosMensal);
router.get("/disponiveis", getHorariosDisponiveis);
router.post("/", criarAgendamento);

export default router;
