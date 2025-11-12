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
    const { nome_colaborador, tipo_id, usuario, senha, unidade_id, id_escala } = req.body;

    if (!nome_colaborador || !tipo_id || !usuario || !senha || !unidade_id) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
    }

    // valida e-mail certo
    if (!usuario.toLowerCase().endsWith('@rokuzen.com')) {
        return res.status(400).json({ error: 'Use um e-mail @rokuzen.com para acessar o sistema.' });
    }

    const conn = await db.getConnection();
    await conn.beginTransaction();
    try {
        const [result] = await conn.query(
            `INSERT INTO colaboradores (nome_colaborador, tipo_id, usuario, senha, ativo, id_escala)
             VALUES (?, ?, ?, ?, 'S', ?)`,
            [nome_colaborador, tipo_id, usuario, senha, id_escala]
        );

        const colaboradorId = result.insertId;

        await conn.query(
            `INSERT INTO colab_unidade (colab_id, unidade_id) VALUES (?, ?)`,
            [colaboradorId, unidade_id]
        );

        await conn.commit();
        res.status(201).json({ message: 'Colaborador criado com sucesso!', colaboradorId });
    } catch (err) {
        await conn.rollback();
        console.error('Erro ao criar colaborador:', err);
        // Return the error message to assist debugging (can be sanitized later)
        res.status(500).json({ error: err && err.message ? err.message : 'Erro ao criar colaborador.' });
    } finally {
        conn.release();
    }
};

export const handleLogin = async (req, res) => {
    try {
        const { user, password } = req.body;
        if (!user || !password) {
            return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
        }

        // Busca pelo usuário (usuário é o campo "usuario" na tabela)
        const [rows] = await db.query(
            `SELECT colaborador_id, nome_colaborador, tipo_id, usuario, senha, ativo
       FROM colaboradores
       WHERE usuario = ?
       LIMIT 1`,
            [user]
        );

        if (!rows.length) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }

        const colaborador = rows[0];

        // Se você usar bcrypt, substitua a verificação abaixo por compare.
        if (colaborador.senha !== password) {
            return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
        }

        if (colaborador.ativo !== 'S') {
            return res.status(403).json({ error: 'Conta inativa. Contate o administrador.' });
        }

        // Sucesso: devolve tipo_id para o frontend direcionar a página
        return res.json({
            success: true,
            colaborador_id: colaborador.colaborador_id,
            nome_colaborador: colaborador.nome_colaborador,
            tipo_id: colaborador.tipo_id
        });
    } catch (err) {
        console.error('Erro no login:', err);
        return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};