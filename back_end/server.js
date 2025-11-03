import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import clientesRoutes from './routes/clientes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/clientes', clientesRoutes);

(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS data');
    console.log('✅ Conexão com o banco de dados bem-sucedida!', rows[0]);
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
  }
})();

app.get('/', (req, res) => res.send('API rodando 🚀'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));