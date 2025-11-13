import db from "../config/db.js";

export const listarPrecos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        s.servico_id,
        s.nome_servico,
        sp.duracao_min,
        sp.valor
      FROM servico_precos sp
      JOIN servicos s ON s.servico_id = sp.servico_id
      ORDER BY s.nome_servico, sp.duracao_min;
    `);
    res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao listar preços de serviços:", error);
    res.status(500).json({ error: "Erro ao buscar preços de serviços." });
  }
};