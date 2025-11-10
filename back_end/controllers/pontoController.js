export const registrarEntrada = async (req, res) => {
    const { colaborador_id } = req.body;
    if (!colaborador_id)
      return res.status(400).json({ error: "colaborador_id obrigatório" });
  
    try {
      // Busca a unidade do colaborador
      const [colab] = await db.query(
        "SELECT unidade_id FROM colaboradores WHERE colaborador_id = ?",
        [colaborador_id]
      );
  
      if (!colab.length) {
        return res.status(404).json({ error: "Colaborador não encontrado" });
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
  
  