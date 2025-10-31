const db = require('../config/db');

async function listarClientesPorUnidade(req, res) {
  const { idUnidade } = req.params;

  const clientes = await db.query(`
    SELECT c.*, cu.id_unidade
    FROM clientes c
    JOIN cliente_unidade cu ON cu.id_cliente = c.id_cliente
    WHERE cu.id_unidade = ?
  `, [idUnidade]);

  const clientesComSaude = await Promise.all(clientes.map(async cliente => {
    const condicoes = await db.query(`
      SELECT cm.nome_condicao
      FROM condicoes_medicas cm
      JOIN cliente_condicoes_medicas ccm ON ccm.id_condicao = cm.id_condicao
      WHERE ccm.id_cliente = ?
    `, [cliente.id_cliente]);

    const alergias = await db.query(`
      SELECT a.nome_alergia
      FROM alergias a
      JOIN cliente_alergias ca ON ca.id_alergia = a.id_alergia
      WHERE ca.id_cliente = ?
    `, [cliente.id_cliente]);

    const historico = await db.query(`
      SELECT h.descricao
      FROM historico_saude h
      JOIN cliente_historico_saude chs ON chs.id_historico = h.id_historico
      WHERE chs.id_cliente = ?
    `, [cliente.id_cliente]);

    cliente.saude = [
      condicoes.map(c => c.nome_condicao).join(', '),
      alergias.map(a => a.nome_alergia).join(', '),
      historico.map(h => h.descricao).join(', ')
    ].filter(Boolean).join(' | ') || 'Nenhum';

    return cliente;
  }));

  res.json(clientesComSaude);
}

module.exports = { listarClientesPorUnidade };
