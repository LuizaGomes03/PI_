import pool from "../config/db.js";

function formatSQLLocal(dt) {
    const Y = dt.getFullYear();
    const M = String(dt.getMonth() + 1).padStart(2, "0");
    const D = String(dt.getDate()).padStart(2, "0");
    const h = String(dt.getHours()).padStart(2, "0");
    const m = String(dt.getMinutes()).padStart(2, "0");
    const s = String(dt.getSeconds()).padStart(2, "0");
    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

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

        // 1) Escalas do dia
        const [colaboradores] = await pool.query(`
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
        `, [diaSemana, unidade_id]);

        if (colaboradores.length === 0)
            return res.json([]);

        // 2) Agendamentos do dia
        const [agendamentos] = await pool.query(`
            SELECT 
                atendimento_id,
                colaborador_id,
                data_inicio,
                data_fim
            FROM atendimentos
            WHERE unidade_id = ?
            AND DATE(data_inicio) = ?
            AND status = 'agendado'
        `, [unidade_id, data]);

        // 3) Gerar horários
        const resposta = [];

        for (const colab of colaboradores) {

            const inicio = new Date(`${data}T${colab.hora_inicio}`);
            const fim = new Date(`${data}T${colab.hora_fim}`);

            for (let h = new Date(inicio); h < fim; h = new Date(h.getTime() + 60 * 60000)) {

                const horaFormatada = h.toTimeString().substring(0, 5);

                // checar conflito
                const conflito = agendamentos.find(a => {
                    const ini = new Date(a.data_inicio);
                    const fimA = new Date(a.data_fim);
                    return (
                        a.colaborador_id === colab.colaborador_id &&
                        h >= ini &&
                        h < fimA
                    );
                });

                if (conflito) {
                    // devolve como ocupado
                    resposta.push({
                        colaborador_id: colab.colaborador_id,
                        profissional: colab.profissional,
                        horario: horaFormatada,
                        status: "ocupado",
                        atendimento_id: conflito.atendimento_id
                    });
                } else {
                    resposta.push({
                        colaborador_id: colab.colaborador_id,
                        profissional: colab.profissional,
                        horario: horaFormatada,
                        status: "livre"
                    });
                }
            }
        }

        res.json(resposta);

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
            data_inicio,
            criado_por
        } = req.body;

        if (!unidade_id || !cliente_id || !colaborador_id || !servico_id || !preco_id || !data_inicio) {
            return res.status(400).json({ error: "Campos obrigatórios faltando." });
        }

        // 1) pegar duracao do preco_id
        const [[preco]] = await pool.query(`SELECT duracao_min, valor FROM servico_precos WHERE preco_id = ?`, [preco_id]);
        if (!preco) return res.status(400).json({ error: "Preco inválido." });

        const duracaoMin = Number(preco.duracao_min);

        function parseLocalDateTimeString(s) {
            if (!s || typeof s !== "string") return null;

            // normalize "T" para espaço
            const norm = s.replace("T", " ");
            // aceita "YYYY-MM-DD HH:MM:SS" ou "YYYY-MM-DD HH:MM"
            const parts = norm.split(" ");
            if (parts.length < 2) return null;

            const [ymd, hms] = parts;
            const [year, month, day] = ymd.split("-").map(Number);
            const timeParts = (hms || "00:00:00").split(":").map(Number);
            const hour = timeParts[0] || 0;
            const minute = timeParts[1] || 0;
            const second = timeParts[2] || 0;

            if ([year, month, day].some(n => !Number.isFinite(n))) return null;

            // cria Date local explicitamente (evita interpretações ambíguas)
            return new Date(year, month - 1, day, hour, minute, second);
        }

        const dataInicio = parseLocalDateTimeString(data_inicio);
        if (!dataInicio || isNaN(dataInicio.getTime())) {
            console.error("Payload data_inicio inválida recebida:", data_inicio);
            return res.status(400).json({ error: "data_inicio inválida." });
        }

        const dataFim = new Date(dataInicio.getTime() + duracaoMin * 60000);

        // formata usando hora local (sem toISOString)
        const dataInicioSQL = formatSQLLocal(dataInicio);
        const dataFimSQL = formatSQLLocal(dataFim);

        // LOG útil para debug — remove em produção
        console.log("DEBUG criarAgendamento - recebido data_inicio:", data_inicio);
        console.log("DEBUG criarAgendamento - parsed dataInicio (local):", dataInicio.toString());
        console.log("DEBUG criarAgendamento - dataInicioSQL:", dataInicioSQL, " dataFimSQL:", dataFimSQL);

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

export const cancelarAtendimento = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("DEBUG SERVER → cancelarAtendimento ID recebido:", id);

        // 1. Verifica se existe
        const [row] = await pool.query(
            `SELECT atendimento_id, status 
       FROM atendimentos 
       WHERE atendimento_id = ? 
       LIMIT 1`,
            [id]
        );

        if (!row || row.length === 0) {
            console.log("DEBUG SERVER → NÃO encontrado:", id);
            return res.status(404).json({ error: "Agendamento não encontrado." });
        }

        console.log("DEBUG SERVER → Registro encontrado:", row[0]);

        // 2. Atualiza status
        const [result] = await pool.query(
            `UPDATE atendimentos
       SET status = 'cancelado'
       WHERE atendimento_id = ?`,
            [id]
        );

        console.log("DEBUG SERVER → affectedRows:", result.affectedRows);

        if (result.affectedRows === 0) {
            return res
                .status(404)
                .json({ error: "Agendamento já estava cancelado ou não foi alterado." });
        }

        // Tudo certo
        return res.json({
            success: true,
            message: "Agendamento cancelado com sucesso."
        });

    } catch (err) {
        console.error("ERRO cancelarAtendimento →", err);
        res.status(500).json({ error: "Erro ao cancelar agendamento." });
    }
};

export const getAtendimentosDoColaborador = async (req, res) => {
    try {
        const { colaborador_id, data } = req.query;

        if (!colaborador_id || !data) {
            return res.status(400).json({ error: "Parâmetros inválidos." });
        }

        const [rows] = await pool.query(
            `SELECT 
          a.atendimento_id,
          a.data_inicio,
          a.data_fim,
          c.nome_cliente
       FROM atendimentos a
       JOIN clientes c ON c.cliente_id = a.cliente_id
       WHERE a.colaborador_id = ?
       AND DATE(a.data_inicio) = ?
       AND a.status = 'agendado'
       ORDER BY a.data_inicio ASC`,
            [colaborador_id, data]
        );

        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao carregar atendimentos." });
    }
};

export async function getAgendamentosDoColaboradorNoDia(req, res) {
    try {
        const { colaborador_id } = req.params;
        const { data } = req.query;

        if (!colaborador_id || !data) {
            return res.status(400).json({ error: "Parâmetros inválidos." });
        }

        const [rows] = await pool.query(
            `SELECT 
                a.atendimento_id,
                a.cliente_id,
                c.nome_cliente,
                DATE_FORMAT(a.data_inicio, '%Y-%m-%d %H:%i:%s') AS data_inicio,
                DATE_FORMAT(a.data_fim,    '%Y-%m-%d %H:%i:%s') AS data_fim,
                a.status
             FROM atendimentos a
             LEFT JOIN clientes c ON c.cliente_id = a.cliente_id
             WHERE a.colaborador_id = ?
               AND DATE(a.data_inicio) = ?
               AND a.status = 'agendado'
             ORDER BY a.data_inicio ASC`,
            [colaborador_id, data]
        );

        res.json(rows);
    } catch (error) {
        console.error("Erro getAgendamentosDoColaboradorNoDia:", error);
        res.status(500).json({ error: "Erro ao buscar agendamentos do colaborador." });
    }
}