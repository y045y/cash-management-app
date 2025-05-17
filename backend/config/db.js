const sql = require("mssql");

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

const connectDB = async () => {
  try {
    await sql.connect(config);
    console.log("✅ SQL Server に接続成功");
  } catch (err) {
    console.error("❌ SQL Server 接続エラー:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
module.exports.sql = sql;
module.exports.config = config;
