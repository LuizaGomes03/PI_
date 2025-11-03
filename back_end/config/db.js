import mysql from 'mysql2/promise';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

let sslConfig = undefined;
try {
  sslConfig = {
    ca: fs.readFileSync('./config/aiven-ca.pem')
  };
  console.log('🔒 Certificado SSL carregado com sucesso!');
} catch (err) {
  console.warn('⚠️ Certificado SSL não encontrado, conectando sem SSL.');
  sslConfig = undefined;
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: sslConfig
});

console.log('🌐 Conectando ao banco:', process.env.DB_NAME);

export default pool;