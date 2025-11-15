import express from "express";
import {
  listarAtendimentos,
  iniciarAtendimento,
  encerrarAtendimento,
  getAtendimentosMensal,
  getHorariosDisponiveis,
  criarAgendamento,
  cancelarAtendimento,
  getAtendimentosDoColaborador,
  getAgendamentosDoColaboradorNoDia
} from "../controllers/atendimentosController.js";

const router = express.Router();

router.get("/", listarAtendimentos);


router.put('/cancelar/:id', cancelarAtendimento);


router.put("/:id/iniciar", iniciarAtendimento);
router.put("/:id/encerrar", encerrarAtendimento);

router.get("/mensal", getAtendimentosMensal);
router.get("/disponiveis", getHorariosDisponiveis);
router.post("/", criarAgendamento);
router.get("/profissional/dia", getAtendimentosDoColaborador);
router.get("/colaborador/:colaborador_id", getAgendamentosDoColaboradorNoDia);

export default router;