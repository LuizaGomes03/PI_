import express from "express";
import db from "../config/db.js";

const router = express.Router();

// rota GET para listar todos os giftcards
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM giftcard");
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar giftcards:", err);
    res.status(500).json({ error: "Erro ao buscar giftcards." });
  }
});

export default router;
