import express from "express";
import {
  listarAtendimentos,
  iniciarAtendimento,
  encerrarAtendimento,
  getAtendimentosMensal,
  getHorariosDisponiveis,
  criarAgendamento,
  cancelarAtendimento
} from "../controllers/atendimentosController.js";

const router = express.Router();

router.get("/", listarAtendimentos);


router.put('/cancelar/:id', cancelarAtendimento);


router.put("/:id/iniciar", iniciarAtendimento);
router.put("/:id/encerrar", encerrarAtendimento);

router.get("/mensal", getAtendimentosMensal);
router.get("/disponiveis", getHorariosDisponiveis);
router.post("/", criarAgendamento);
export default router;