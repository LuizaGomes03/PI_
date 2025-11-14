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

export const getServicos = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT servico_id, nome_servico FROM servicos ORDER BY nome_servico`);
    res.json(rows);
  } catch (err) {
    console.error("Erro getServicos:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// GET /api/servicos/:servico_id/precos -> lista duracoes/valores (servico_precos)
export const getPrecosDoServico = async (req, res) => {
  const { servico_id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT preco_id, duracao_min, valor FROM servico_precos WHERE servico_id = ? ORDER BY duracao_min`,
      [servico_id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro getPrecosDoServico:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};