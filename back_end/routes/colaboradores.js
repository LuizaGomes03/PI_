import express from "express";
const router = express.Router();
import {
    listarColaboradoresPorUnidade
} from "../controllers/colaboradoresController.js";

router.get("/colaboradores/unidade/:unidadeId", listarColaboradoresPorUnidade);
export default router;