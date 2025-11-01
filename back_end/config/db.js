const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Caminho do certificado
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

module.exports = pool;
