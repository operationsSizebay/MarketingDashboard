require('dotenv').config();
const mysql = require('mysql2/promise');

const brPool = mysql.createPool({
  host: process.env.DB_BR_HOST,
  port: Number(process.env.DB_BR_PORT) || 3306,
  user: process.env.DB_BR_USER,
  password: process.env.DB_BR_PASS,
  database: process.env.DB_BR_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
});

const intPool = mysql.createPool({
  host: process.env.DB_INT_HOST,
  port: Number(process.env.DB_INT_PORT) || 3306,
  user: process.env.DB_INT_USER,
  password: process.env.DB_INT_PASS,
  database: process.env.DB_INT_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
});

module.exports = { brPool, intPool };
