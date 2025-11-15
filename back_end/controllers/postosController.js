import pool from "../config/db.js";

export const getPostosTrabalho = async (req, res) => {
    try {
        const { unidade_id } = req.query;

        const [rows] = await pool.query(
            `SELECT 
                pt.tipo,
                SUM(pt.total) AS total,
                SUM(CASE WHEN a.status = 'em_andamento' THEN 1 ELSE 0 END) AS ocupados
             FROM postos_trabalho pt
             LEFT JOIN atendimentos a 
             ON a.posto_id = pt.posto_id
             AND DATE(a.inicio_atendimento) = CURDATE()
             WHERE pt.unidade_id = ?
             GROUP BY pt.tipo`,
            [unidade_id]
        );

        const final = rows.map(r => ({
            tipo: r.tipo,
            total: r.total,
            ocupados: r.ocupados,
            livres: r.total - r.ocupados
        }));

        res.json(final);
    } catch (error) {
        console.error("Erro obterPostosTrabalho:", error);
        res.status(500).json({ error: "Erro ao buscar postos de trabalho." });
    }
};
