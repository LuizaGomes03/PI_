import express from "express";
const router = express.Router();
import {
  listarColaboradoresPorUnidade,
  criarColaborador,
  handleLogin
} from "../controllers/colaboradoresController.js";

router.post("/colaboradores", criarColaborador);
router.post("/login", handleLogin);
router.get("/colaboradores/unidade/:unidadeId", listarColaboradoresPorUnidade);

export default router;