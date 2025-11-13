import db from "../config/db.js";

export const getPrecos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sp.preco_id, s.nome_servico, sp.servico_id, sp.duracao_min, sp.valor
      FROM servico_precos sp
      JOIN servicos s ON s.servico_id = sp.servico_id
      ORDER BY s.nome_servico, sp.duracao_min;
    `);
    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    res.status(500).json({ error: "Erro ao buscar preços" });
  }
};

export const addPreco = async (req, res) => {
  try {
    const { nome_servico, duracao_min, valor } = req.body;
    if (!nome_servico || !duracao_min || !valor)
      return res.status(400).json({ error: "Dados incompletos." });

    // Busca serviço pelo nome (ou cria se não existir)
    const [servico] = await db.query(
      `SELECT servico_id FROM servicos WHERE nome_servico = ?`,
      [nome_servico]
    );
    let servicoId = servico.length ? servico[0].servico_id : null;
    if (!servicoId) {
      const [inserted] = await db.query(
        `INSERT INTO servicos (nome_servico) VALUES (?)`,
        [nome_servico]
      );
      servicoId = inserted.insertId;
    }

    await db.query(
      `INSERT INTO servico_precos (servico_id, duracao_min, valor) VALUES (?, ?, ?)`,
      [servicoId, duracao_min, valor]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Erro ao adicionar preço:", error);
    res.status(500).json({ error: "Erro ao adicionar preço" });
  }
};

export const updatePreco = async (req, res) => {
  try {
    const { preco_id } = req.params;
    const { duracao_min, valor } = req.body;

    const [result] = await db.query(
      `UPDATE servico_precos SET duracao_min = ?, valor = ? WHERE preco_id = ?`,
      [duracao_min, valor, preco_id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Preço não encontrado" });

    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar preço:", error);
    res.status(500).json({ error: "Erro ao atualizar preço" });
  }
};

export const deletePreco = async (req, res) => {
  try {
    const { preco_id } = req.params;
    await db.query(`DELETE FROM servico_precos WHERE preco_id = ?`, [preco_id]);
    res.json({ success: true });
  } catch (error) {
    console.error("Erro ao remover preço:", error);
    res.status(500).json({ error: "Erro ao remover preço" });
  }
};