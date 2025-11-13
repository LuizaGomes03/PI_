import express from "express";
import { getPrecos, addPreco, updatePreco, deletePreco } from "../controllers/precosController.js";

const router = express.Router();

router.get("/", getPrecos);
router.post("/", addPreco);
router.put("/:preco_id", updatePreco);
router.delete("/:preco_id", deletePreco);

export default router;
