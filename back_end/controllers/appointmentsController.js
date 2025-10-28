const pool = require('../config/db');

//lista todos os atendimentos
async function getAppointments(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.atendimento_id,
        a.unidade_id,
        u.nome_unidade,
        a.cliente_id,
        c.nome_cliente,
        a.servico_id,
        s.nome_servico,
        a.colaborador_id,
        colab.nome_colaborador,
        a.inicio_atendimento,
        a.fim_atendimento,
        a.valor_servico,
        a.tipo_pagamento,
        a.observacao_cliente,
        a.foi_marcado_online
      FROM atendimentos a
      LEFT JOIN unidades u ON a.unidade_id = u.unidade_id
      LEFT JOIN clientes c ON a.cliente_id = c.cliente_id
      LEFT JOIN servicos s ON a.servico_id = s.servico_id
      LEFT JOIN colaboradores colab ON a.colaborador_id = colab.colaborador_id
      ORDER BY a.inicio_atendimento DESC
    `);

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

//cria novo atendimento
async function addAppointment(req, res) {
  const {
    unidade_id,
    cliente_id,
    servico_id,
    colaborador_id,
    inicio_atendimento,
    fim_atendimento,
    valor_servico,
    tipo_pagamento,
    observacao_cliente,
    foi_marcado_online
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO atendimentos 
      (unidade_id, cliente_id, servico_id, colaborador_id, inicio_atendimento, fim_atendimento, valor_servico, tipo_pagamento, observacao_cliente, foi_marcado_online)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        unidade_id,
        cliente_id,
        servico_id,
        colaborador_id,
        inicio_atendimento,
        fim_atendimento,
        valor_servico,
        tipo_pagamento,
        observacao_cliente,
        foi_marcado_online
      ]
    );

    res.status(201).json({ message: 'Atendimento registrado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAppointments, addAppointment };
