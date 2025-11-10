import db from "../config/db.js";

export const registrarEntrada = async (req, res) => {
  const { colaborador_id } = req.body;
  if (!colaborador_id)
    return res.status(400).json({ error: "colaborador_id obrigatório" });

  try {
    // Busca a unidade do colaborador (agora via colab_unidade)
    const [colab] = await db.query(
      `SELECT cu.unidade_id 
       FROM colab_unidade cu
       WHERE cu.colab_id = ?`,
      [colaborador_id]
    );

    if (!colab.length) {
      return res.status(404).json({ error: "Colaborador não vinculado a uma unidade." });
    }

    const unidade_id = colab[0].unidade_id;

    // Verifica se já existe ponto hoje
    const [existe] = await db.query(
      "SELECT * FROM ponto_eletronico WHERE colaborador_id = ? AND DATE(entrada) = CURDATE()",
      [colaborador_id]
    );

    if (existe.length > 0) {
      return res.status(400).json({ error: "Entrada já registrada hoje." });
    }

    // Insere com unidade
    await db.query(
      "INSERT INTO ponto_eletronico (colaborador_id, unidade_id, entrada) VALUES (?, ?, NOW())",
      [colaborador_id, unidade_id]
    );

    res.json({ message: "Entrada registrada com sucesso!" });
  } catch (err) {
    console.error("❌ ERRO AO REGISTRAR ENTRADA:", err);
    res.status(500).json({ error: "Erro ao registrar entrada" });
  }
};


// ===================== REGISTRAR SAÍDA =====================
export const registrarSaida = async (req, res) => {
  const { colaborador_id } = req.body;
  if (!colaborador_id)
    return res.status(400).json({ error: "colaborador_id obrigatório" });

  try {
    // Verifica se o colaborador tem entrada hoje
    const [ponto] = await db.query(
      "SELECT * FROM ponto_eletronico WHERE colaborador_id = ? AND DATE(entrada) = CURDATE() AND saida IS NULL",
      [colaborador_id]
    );

    if (ponto.length === 0) {
      return res.status(400).json({ error: "Nenhuma entrada encontrada para hoje." });
    }

    // Atualiza a saída com o horário atual
    await db.query(
      "UPDATE ponto_eletronico SET saida = NOW() WHERE ponto_id = ?",
      [ponto[0].ponto_id]
    );

    res.json({ message: "Saída registrada com sucesso!" });
  } catch (err) {
    console.error("❌ ERRO AO REGISTRAR SAÍDA:", err);
    res.status(500).json({ error: "Erro ao registrar saída" });
  }
};

export const listarPontos = async (req, res) => {
  try {
    const { unidade_id } = req.query;

    let query = `
      SELECT 
        p.ponto_id,
        c.nome_colaborador,
        c.usuario AS email_colaborador,
        t.nome_tipo AS funcao,
        p.entrada,
        p.saida
      FROM ponto_eletronico p
      JOIN colaboradores c ON p.colaborador_id = c.colaborador_id
      LEFT JOIN tipo_colaborador t ON c.tipo_id = t.tipo_id
    `;

    const params = [];

    if (unidade_id) {
      query += " WHERE p.unidade_id = ?";
      params.push(unidade_id);
    }

    query += " ORDER BY p.entrada DESC";

    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error("❌ ERRO AO LISTAR PONTOS:", err);
    res.status(500).json({ error: "Erro ao listar pontos" });
  }
};