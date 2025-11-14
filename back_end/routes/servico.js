import express from "express";
import { listarPrecos, getServicos, getPrecosDoServico} from "../controllers/servicoController.js";

const router = express.Router();

// GET /api/servicos/precos
router.get("/servicos/precos", listarPrecos);
router.get("/", getServicos);
router.get("/:servico_id/precos", getPrecosDoServico);

export default router;