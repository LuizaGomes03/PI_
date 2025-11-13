import pool from "../config/db.js";

export const getPostosTrabalho = async (req, res) => {
  try {
    const unidade_id = req.query.unidade_id;
    if (!unidade_id)
      return res.status(400).json({ error: "unidade_id obrigatório" });

    const sql = `
      SELECT 
        tipo,
        SUM(total) AS total,
        SUM(ocupados) AS ocupados,
        SUM(total - ocupados) AS livres
      FROM postos_trabalho
      WHERE unidade_id = ?
      GROUP BY tipo
      ORDER BY FIELD(tipo, 'Maca','Poltrona','Cadeira');
    `;

    const [rows] = await pool.query(sql, [unidade_id]);
    res.json(rows);
  } catch (err) {
    console.error("❌ Erro ao buscar postos:", err);
    res.status(500).json({ error: "Erro ao buscar postos de trabalho." });
  }
};
