import express from "express";
import { getPostosTrabalho } from "../controllers/postosController.js";

const router = express.Router();

router.get("/", getPostosTrabalho);

export default router;