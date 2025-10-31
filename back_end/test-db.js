import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  try {
    const pool = await mysql.createPool({
      host: 'mysql-3b1b655e-pi2025.b.aivencloud.com', // mesmo host do Workbench
      port: 10755, // mesma porta
      user: 'avadmin',
      password: 'SUA_SENHA_AQUI', // MESMA senha usada no Workbench
      database: 'defaultdb',      // ou o nome exato do seu BD
      ssl: {
        rejectUnauthorized: false // Aiven exige SSL; esse modo ignora o certificado
      }
    });

    const [rows] = await pool.query('SELECT NOW() AS data');
    console.log('✅ Conexão bem-sucedida!', rows);
    pool.end();
  } catch (err) {
    console.error('❌ Erro de conexão:', err.message);
  }
}

testConnection();
