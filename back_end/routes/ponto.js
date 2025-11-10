import express from "express";
import { registrarEntrada, registrarSaida } from "../controllers/pontoController.js";
const router = express.Router();

router.post("/ponto/entrada", registrarEntrada);
router.put("/ponto/saida", registrarSaida);

export default router;
