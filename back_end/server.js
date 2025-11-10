import express from 'express';
import cors from 'cors';
import pool from './config/db.js';
import clientesRoutes from './routes/clientes.js';
import colaboradoresRoutes from './routes/colaboradores.js';
import giftcardsRoutes from './routes/giftcards.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendPath = path.join(__dirname, '..');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(frontendPath)); 
app.use(express.static(path.join(frontendPath, 'HTML'))); 
app.use(express.static(path.join(frontendPath, 'CSS'))); 
app.use(express.static(path.join(frontendPath, 'JS'))); 

app.use('/api/clientes', clientesRoutes);
app.use('/api', colaboradoresRoutes);
app.use('/api/giftcards', giftcardsRoutes);

(async () => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS data');
    console.log('✅ Conexão com o banco de dados bem-sucedida!', rows[0]);
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco:', err.message);
  }
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'HTML', 'login.html')); // Serve login.html na raiz
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
