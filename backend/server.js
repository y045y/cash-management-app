require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 環境変数からDB接続情報を取得
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// SQL Server に接続
sql.connect(config)
    .then(() => console.log("✅ SQL Server に接続成功"))
    .catch((err) => console.error("❌ SQL Server 接続エラー:", err));

// 🔥 `Transactions` テーブルの全データを取得する API
app.get("/api/transactions", async (req, res) => {
    try {
        const result = await sql.query("SELECT * FROM Transactions ORDER BY TransactionDate DESC");
        res.json(result.recordset); // JSON 形式でデータを返す
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});
app.get("/api/cashstate", async (req, res) => {
    try {
        const result = await sql.query("EXEC CalculateCurrentInventory");
        if (result.recordset.length > 0) {
            const data = result.recordset[0];
            data.CurrentInventory = JSON.parse(data.CurrentInventory); // 🔥 ここでオブジェクトに変換！
            res.json(data);
        } else {
            res.json({ CurrentInventory: {}, TotalAmount: 0 });
        }
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});

app.get("/api/cashstate", async (req, res) => {
    try {
        const result = await sql.query("EXEC CalculateCurrentInventory");
        res.json(result.recordset[0]); // 結果をJSONで返す
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});



// サーバーを起動
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
});
