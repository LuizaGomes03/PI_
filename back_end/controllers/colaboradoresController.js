import db from '../config/db.js';

export const listarColaboradoresPorUnidade = async (req, res) => {
    const { unidadeId } = req.params;

    try {
        const [rows] = await db.query(`
      SELECT 
        c.colaborador_id,
        c.nome_colaborador,
        c.ativo,
        c.tipo_id,
        c.usuario,
        c.senha
      FROM colaboradores c
      JOIN colab_unidade cu ON c.colaborador_id = cu.colab_id
      WHERE cu.unidade_id = ?
      ORDER BY c.nome_colaborador;
    `, [unidadeId]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Nenhum colaborador encontrado para esta unidade.' });
        }

        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar colaboradores:', err);
        res.status(500).json({ error: 'Erro ao buscar colaboradores.' });
    }
};

export const criarColaborador = async (req, res) => {
  console.log("📩 Dados recebidos no POST /api/colaboradores:", req.body);
  const { nome_colaborador, tipo_id, usuario, senha, unidade_id } = req.body;

  if (!nome_colaborador || !tipo_id || !usuario || !senha || !unidade_id) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO colaboradores (nome_colaborador, tipo_id, usuario, senha, ativo)
       VALUES (?, ?, ?, ?, 'S')`,
      [nome_colaborador, tipo_id, usuario, senha]
    );

    const colaboradorId = result.insertId;

    // vincula à unidade
    await db.query(
      `INSERT INTO colab_unidade (colab_id, unidade_id) VALUES (?, ?)`,
      [colaboradorId, unidade_id]
    );

    res.status(201).json({ message: 'Colaborador criado com sucesso!', colaboradorId });
  } catch (err) {
    console.error('Erro ao criar colaborador:', err);
    res.status(500).json({ error: 'Erro ao criar colaborador.' });
  }
};
