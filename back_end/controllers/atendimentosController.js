import pool from "../config/db.js";

/* === LISTAR AGENDAMENTOS (com filtros opcionais) === */
export const listarAtendimentos = async (req, res) => {
    try {
        const { unidade_id, colaborador_id, data } = req.query;

        let sql = `
      SELECT 
        a.id AS atendimento_id,
        c.nome_colaborador,
        cli.nome_cliente,
        s.nome_servico,
        a.data_atendimento,
        a.hora_inicio,
        a.hora_fim,
        a.status,
        a.inicio_atendimento,
        a.fim_atendimento
      FROM atendimentos a
      JOIN colaboradores c ON a.colaborador_id = c.colaborador_id
      JOIN clientes cli ON a.cliente_id = cli.cliente_id
      JOIN servicos s ON a.servico_id = s.servico_id
      WHERE 1=1
    `;

        const params = [];
        if (unidade_id) {
            sql += " AND a.unidade_id = ?";
            params.push(unidade_id);
        }
        if (colaborador_id) {
            sql += " AND a.colaborador_id = ?";
            params.push(colaborador_id);
        }
        if (data) {
            sql += " AND DATE(a.data_atendimento) = ?";
            params.push(data);
        }

        sql += " ORDER BY a.data_atendimento, a.hora_inicio";

        const [rows] = await pool.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error("Erro ao listar atendimentos:", err);
        res.status(500).json({ message: "Erro ao listar atendimentos" });
    }
};

/* === CRIAR NOVO AGENDAMENTO === */
export const criarAtendimento = async (req, res) => {
    try {
        const {
            cliente_id,
            colaborador_id,
            servico_id,
            unidade_id,
            data_atendimento,
            hora_inicio,
            hora_fim,
            observacoes,
        } = req.body;

        if (!cliente_id || !colaborador_id || !servico_id || !unidade_id) {
            return res.status(400).json({ message: "Campos obrigatórios faltando" });
        }

        // Insere agendamento
        const [result] = await pool.query(
            `INSERT INTO atendimentos
      (cliente_id, colaborador_id, servico_id, unidade_id, data_atendimento, hora_inicio, hora_fim, status, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'agendado', ?)`,
            [
                cliente_id,
                colaborador_id,
                servico_id,
                unidade_id,
                data_atendimento,
                hora_inicio,
                hora_fim,
                observacoes || null,
            ]
        );

        res.status(201).json({
            message: "Agendamento criado com sucesso",
            atendimento_id: result.insertId,
        });
    } catch (err) {
        console.error("Erro ao criar agendamento:", err);
        res.status(500).json({ message: "Erro ao criar agendamento" });
    }
};

/* === INICIAR ATENDIMENTO === */
export const iniciarAtendimento = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `UPDATE atendimentos 
       SET inicio_atendimento = NOW(), status = 'em_andamento'
       WHERE id = ? AND status = 'agendado'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Atendimento não encontrado ou já iniciado" });
        }

        res.json({ message: "Sessão iniciada com sucesso" });
    } catch (err) {
        console.error("Erro ao iniciar atendimento:", err);
        res.status(500).json({ message: "Erro ao iniciar atendimento" });
    }
};

/* === ENCERRAR ATENDIMENTO === */
export const encerrarAtendimento = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `UPDATE atendimentos 
       SET fim_atendimento = NOW(), status = 'concluido'
       WHERE id = ? AND status = 'em_andamento'`,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Atendimento não encontrado ou já encerrado" });
        }

        res.json({ message: "Sessão encerrada com sucesso" });
    } catch (err) {
        console.error("Erro ao encerrar atendimento:", err);
        res.status(500).json({ message: "Erro ao encerrar atendimento" });
    }
};

export async function getAtendimentosMensal(req, res) {
    const { unidade_id, ano, mes } = req.query;

    try {
        const [rows] = await pool.query(`
        SELECT 
            DATE(data_inicio) AS data,
            COUNT(*) AS total_agendamentos,
            SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
            (CASE WHEN COUNT(*) >= 20 THEN 1 ELSE 0 END) AS lotado
        FROM atendimentos
        WHERE unidade_id = ?
            AND MONTH(data_inicio) = ?
            AND YEAR(data_inicio) = ?
        GROUP BY DATE(data_inicio)
        ORDER BY DATE(data_inicio) ASC
        `, [unidade_id, mes, ano]);

        res.json(rows);
    } catch (err) {
        console.error("Erro ao buscar atendimentos mensais:", err);
        res.status(500).json({ error: "Erro ao carregar agendamentos mensais" });
    }
}

export const getHorariosDisponiveis = async (req, res) => {
    const { unidade_id, data } = req.query;

    if (!unidade_id || !data) {
        return res.status(400).json({ error: "Parâmetros inválidos." });
    }

    try {
        const diasSemana = [
            "Domingo",
            "Segunda-feira",
            "Terça-feira",
            "Quarta-feira",
            "Quinta-feira",
            "Sexta-feira",
            "Sábado"
        ];
        const diaSemana = diasSemana[new Date(data).getDay()];

        // 1️⃣ Colaboradores com escala no dia
        const [colaboradores] = await pool.query(
            `
       SELECT 
        c.colaborador_id,
        c.nome_colaborador AS profissional,
        e.hora_inicio,
        e.hora_fim
    FROM colaboradores c
    JOIN escala e ON c.id_escala = e.id_escala
    JOIN colab_unidade cu ON cu.colab_id = c.colaborador_id
    WHERE e.dia = ? 
      AND c.ativo = 'S'
      AND cu.unidade_id = ?
      AND c.tipo_id = 1
      `,
            [diaSemana, unidade_id]
        );

        if (colaboradores.length === 0) {
            return res.json([]);
        }

        // 2️⃣ Agendamentos do dia
        const [agendamentos] = await pool.query(
            `
      SELECT colaborador_id, data_inicio, data_fim
      FROM atendimentos
      WHERE unidade_id = ?
        AND DATE(data_inicio) = ?
      `,
            [unidade_id, data]
        );

        // 3️⃣ Gera horários de 15 em 15 minutos
        const horariosLivres = [];

        colaboradores.forEach(colab => {
            const inicio = new Date(`${data}T${colab.hora_inicio}`);
            const fim = new Date(`${data}T${colab.hora_fim}`);

            for (let h = new Date(inicio); h < fim; h.setHours(h.getHours() + 1)) {
                const horaFormatada = h.toTimeString().substring(0, 5);

                const ocupado = agendamentos.some(a => {
                    const inicioA = new Date(a.data_inicio);
                    const fimA = new Date(a.data_fim);
                    return (
                        a.id_colaborador === colab.id_colaborador &&
                        h >= inicioA &&
                        h < fimA
                    );
                });

                if (!ocupado) {
                    horariosLivres.push({
                        colaborador_id: colab.colaborador_id,
                        profissional: colab.profissional,
                        horario: horaFormatada
                    });
                }
            }
        });

        res.json(horariosLivres);
    } catch (err) {
        console.error("Erro ao buscar horários disponíveis:", err);
        res.status(500).json({ error: "Erro interno ao buscar horários." });
    }
};

export const criarAgendamento = async (req, res) => {
    try {
        const {
            unidade_id,
            cliente_id,
            colaborador_id,
            servico_id,
            preco_id,
            // opcional: posto_id (se quiser forçar), caso contrário calculamos
            posto_id: postoForcado,
            data_inicio, // ISO string "2025-11-11T08:00:00"
            criado_por
        } = req.body;

        if (!unidade_id || !cliente_id || !colaborador_id || !servico_id || !preco_id || !data_inicio) {
            return res.status(400).json({ error: "Campos obrigatórios faltando." });
        }

        // 1) pegar duracao do preco_id
        const [[preco]] = await pool.query(`SELECT duracao_min, valor FROM servico_precos WHERE preco_id = ?`, [preco_id]);
        if (!preco) return res.status(400).json({ error: "Preco inválido." });

        const duracaoMin = Number(preco.duracao_min);

        const dataInicio = new Date(data_inicio + 'Z');
        if (isNaN(dataInicio.getTime())) return res.status(400).json({ error: "data_inicio inválida." });

        const dataFim = new Date(dataInicio.getTime() + duracaoMin * 60000);

        const dataInicioSQL = dataInicio.toISOString().slice(0, 19).replace('T', ' ');
        const dataFimSQL = dataFim.toISOString().slice(0, 19).replace('T', ' ');
        
        // 2) decidir posto
        let posto_id = null;
        if (postoForcado) {
            posto_id = postoForcado;
        } else {
            // pega quais tipos esse servico aceita (servico_locais)
            const [tiposRows] = await pool.query(
                `SELECT tipo FROM servico_locais WHERE servico_ref_id = ?`,
                [servico_id]
            );
            const tipos = tiposRows.map(r => r.tipo);
            if (tipos.length > 0) {
                // montar placeholders
                const placeholders = tipos.map(_ => "?").join(",");
                const [postos] = await pool.query(
                    `SELECT posto_id FROM postos_trabalho WHERE unidade_id = ? AND tipo IN (${placeholders}) AND (total - ocupados) > 0 LIMIT 1`,
                    [unidade_id, ...tipos]
                );
                if (postos.length > 0) posto_id = postos[0].posto_id;
            }
        }

        // 3) inserir no banco
        const [insertRes] = await pool.query(
            `INSERT INTO atendimentos 
       (unidade_id, cliente_id, colaborador_id, servico_id, preco_id, posto_id, data_inicio, data_fim, status, criado_por)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'agendado', ?)`,
            [unidade_id, cliente_id, colaborador_id, servico_id, preco_id, posto_id, dataInicioSQL, dataFimSQL, criado_por || null]
        );

        const novoId = insertRes.insertId;

        // 4) atualizar posto ocupado (se alocado)
        if (posto_id) {
            await pool.query(`UPDATE postos_trabalho SET ocupados = ocupados + 1 WHERE posto_id = ?`, [posto_id]);
        }

        // 5) retornar sucesso
        res.json({ atendimento_id: novoId, posto_id, data_inicio: dataInicioSQL, data_fim: dataFimSQL });
    } catch (err) {
        console.error("Erro criarAgendamento:", err);
        res.status(500).json({ error: "Erro interno ao criar agendamento." });
    }
};