import express from "express";
const router = express.Router();
import {
    listarColaboradoresPorUnidade,
    criarColaborador
} from "../controllers/colaboradoresController.js";

router.post("/colaboradores", criarColaborador)
router.get("/colaboradores/unidade/:unidadeId", listarColaboradoresPorUnidade);
export default router;