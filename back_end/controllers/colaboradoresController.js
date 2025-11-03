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
