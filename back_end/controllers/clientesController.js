import db from '../config/db.js';

export const listarClientesPorUnidade = async (req, res) => {
  const { unidadeId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT 
        c.cliente_id,
        c.nome_cliente,
        c.telefone_cliente,
        c.email_cliente,
        c.data_nascimento,
        c.primeiro_atendimento,
        c.observacoes,
        c.sexo,
        GROUP_CONCAT(DISTINCT cm.nome SEPARATOR ', ') AS condicoes,
        GROUP_CONCAT(DISTINCT a.nome SEPARATOR ', ') AS alergias,
        GROUP_CONCAT(DISTINCT h.nome SEPARATOR ', ') AS historico
      FROM clientes c
      JOIN cliente_unidade cu ON c.cliente_id = cu.cliente_id
      LEFT JOIN cliente_condicoes cc ON c.cliente_id = cc.cliente_id
      LEFT JOIN condicoes_medicas cm ON cc.condicao_id = cm.id
      LEFT JOIN cliente_alergias ca ON c.cliente_id = ca.cliente_id
      LEFT JOIN alergias a ON ca.alergia_id = a.id
      LEFT JOIN cliente_historico_saude ch ON c.cliente_id = ch.cliente_id
      LEFT JOIN historico_saude h ON ch.historico_id = h.id
      WHERE cu.unidade_id = ?
      GROUP BY c.cliente_id
      ORDER BY c.nome_cliente;
    `, [unidadeId]);

    // substitui nulls por 'Nenhum'
    const formatted = rows.map(r => ({
      ...r,
      condicoes: r.condicoes || 'Nenhum',
      alergias: r.alergias || 'Nenhum',
      historico: r.historico || 'Nenhum'
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar clientes.' });
  }
};

export const cadastrarCliente = async (req, res) => {
  const {
    nome_cliente,
    telefone_cliente,
    email_cliente,
    data_nascimento,
    sexo,
    observacoes,
    unidade_id
  } = req.body;

  if (!nome_cliente || !telefone_cliente || !unidade_id) {
    return res.status(400).json({ error: 'Nome, telefone e unidade são obrigatórios.' });
  }

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    const [result] = await conn.query(
      `INSERT INTO clientes (nome_cliente, telefone_cliente, email_cliente, data_nascimento, sexo, observacoes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nome_cliente, telefone_cliente, email_cliente, data_nascimento, sexo, observacoes]
    );

    const clienteId = result.insertId;

    await conn.query(
      `INSERT INTO cliente_unidade (cliente_id, unidade_id) VALUES (?, ?)`,
      [clienteId, unidade_id]
    );

    await conn.commit();
    res.status(201).json({ message: 'Cliente cadastrado com sucesso!', cliente_id: clienteId });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Erro ao cadastrar cliente.' });
  } finally {
    conn.release();
  }
};

export const atualizarCliente = async (req, res) => {
  const { id } = req.params;
  const {
    nome_cliente,
    telefone_cliente,
    email_cliente,
    data_nascimento,
    sexo,
    observacoes
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE clientes 
       SET nome_cliente=?, telefone_cliente=?, email_cliente=?, data_nascimento=?, sexo=?, observacoes=? 
       WHERE cliente_id=?`,
      [nome_cliente, telefone_cliente, email_cliente, data_nascimento, sexo, observacoes, id]
    );
    if (!result.affectedRows) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ message: 'Cliente atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar cliente.' });
  }
};

export const removerCliente = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM cliente_unidade WHERE cliente_id=?', [id]);
    const [result] = await db.query('DELETE FROM clientes WHERE cliente_id=?', [id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'Cliente não encontrado' });
    res.json({ message: 'Cliente removido com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao remover cliente.' });
  }
};

export const listarAniversariantesDoDia = async (req, res) => {
  const { unidadeId } = req.params;
  try {
    const [rows] = await db.query(`
      SELECT c.nome_cliente
      FROM clientes c
      JOIN cliente_unidade cu ON c.cliente_id = cu.cliente_id
      WHERE cu.unidade_id = ?
        AND c.data_nascimento IS NOT NULL
        AND MONTH(c.data_nascimento) = MONTH(CONVERT_TZ(NOW(), '+00:00', '-03:00'))
        AND DAY(c.data_nascimento) = DAY(CONVERT_TZ(NOW(), '+00:00', '-03:00'));
    `, [unidadeId]);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar aniversariantes:', err);
    res.status(500).json({ error: 'Erro ao buscar aniversariantes.' });
  }
};

export const buscarClientesPorNome = async (req, res) => {
  const q = (req.query.nome || "").trim();
  if (!q) return res.json([]);
  try {
    const [rows] = await db.query(
      `SELECT cliente_id, nome_cliente, telefone FROM clientes WHERE nome_cliente LIKE ? LIMIT 20`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro buscarClientesPorNome:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};

// GET /api/clientes/buscarTelefone?telefone=...
export const buscarClientesPorTelefone = async (req, res) => {
  const q = (req.query.telefone || "").trim();
  if (!q) return res.json([]);
  try {
    const [rows] = await db.query(
      `SELECT cliente_id, nome_cliente, telefone FROM clientes WHERE telefone LIKE ? LIMIT 20`,
      [`%${q}%`]
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro buscarClientesPorTelefone:", err);
    res.status(500).json({ error: "Erro interno" });
  }
};