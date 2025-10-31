const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

// Caminho completo e seguro do certificado Aiven
const caPath = __dirname + '/aiven-ca.pem';

let ca;
try {
  ca = fs.readFileSync(caPath);
  console.log('🔐 Certificado SSL carregado com sucesso.');
} catch (err) {
  console.error('⚠️ Erro ao carregar o certificado SSL:', err.message);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 15000,
  ssl: {
    ca: ca,                      // adiciona o certificado
    rejectUnauthorized: true     // obriga validação segura
  }
});

module.exports = pool;
