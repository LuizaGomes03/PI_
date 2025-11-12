import express from "express";
const router = express.Router();
import {
  listarColaboradoresPorUnidade,
  criarColaborador,
  listarEscalaCompartilhada,
  handleLogin
} from "../controllers/colaboradoresController.js";

router.get("/colaboradores/unidade/:unidadeId", listarColaboradoresPorUnidade);
router.get("/escala/unidade/:unidadeId", listarEscalaCompartilhada);
router.post("/colaboradores", criarColaborador);
router.post("/login", handleLogin);

export default router;