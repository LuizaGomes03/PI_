import express from "express";
import { listarPrecos} from "../controllers/servicoController.js";

const router = express.Router();

// GET /api/servicos/precos
router.get("/servicos/precos", listarPrecos);

export default router;