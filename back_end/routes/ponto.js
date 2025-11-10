import express from "express";
import { registrarEntrada, registrarSaida, listarPontos } from "../controllers/pontoController.js";
const router = express.Router();

router.post("/ponto/entrada", registrarEntrada);
router.put("/ponto/saida", registrarSaida);
router.get("/ponto", listarPontos);

export default router;
