import express from "express";
const router = express.Router();
import {
  listarColaboradoresPorUnidade,
  criarColaborador,
  handleLogin
} from "../controllers/colaboradoresController.js";

router.get("/colaboradores/unidade/:unidadeId", listarColaboradoresPorUnidade);
router.post("/colaboradores", criarColaborador);
router.post("/login", handleLogin);

export default router;