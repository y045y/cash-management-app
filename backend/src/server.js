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

// ✅ SQL Server に接続
const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("✅ SQL Server に接続成功");
    } catch (err) {
        console.error("❌ SQL Server 接続エラー:", err);
        process.exit(1); // エラーが出たらサーバーを止める
    }
};

// 🔥 `/api/transactions` - `Transactions` テーブルの全データを取得
app.get("/api/transactions", async (req, res) => {
    try {
        const result = await sql.query("SELECT * FROM Transactions ORDER BY TransactionDate DESC");
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});

// 🔥 `/api/cashstate` - `CalculateCurrentInventory` ストアドを実行
app.get("/api/cashstate", async (req, res) => {
    try {
        const result = await sql.query("EXEC CalculateCurrentInventory");
        if (result.recordset.length > 0) {
            const data = result.recordset[0];
            data.CurrentInventory = JSON.parse(data.CurrentInventory);
            res.json(data);
        } else {
            res.json({ CurrentInventory: {}, TotalAmount: 0 });
        }
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});

// ✅ `/api/history` - `CalculateTransactionHistory` を実行し、取引履歴を取得
app.get("/api/history", async (req, res) => {
    try {
        const result = await sql.query("EXEC CalculateTransactionHistory");
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});
app.put("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { TransactionType, DenominationJson, Amount, Summary, Memo, Recipient } = req.body;

    try {
        // ✅ 取引を更新
        await sql.query(`
            UPDATE Transactions
            SET TransactionType = '${TransactionType}',
                DenominationJson = '${JSON.stringify(DenominationJson)}',
                Amount = ${Amount},
                Summary = '${Summary}',
                Memo = '${Memo}',
                Recipient = '${Recipient}'
            WHERE Id = ${id}
        `);

        // ✅ `TotalBalance` を再計算
        await sql.query("EXEC CalculateTransactionHistory");

        res.json({ message: "✅ 取引を更新しました" });
    } catch (err) {
        console.error("❌ 更新エラー:", err);
        res.status(500).json({ error: "データ更新に失敗しました" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ 取引の削除
        await sql.query(`DELETE FROM Transactions WHERE Id = ${id}`);

        // ✅ `TotalBalance` を再計算
        await sql.query("EXEC CalculateTransactionHistory");

        res.json({ message: "✅ 取引を削除しました" });
    } catch (err) {
        console.error("❌ 削除エラー:", err);
        res.status(500).json({ error: "データ削除に失敗しました" });
    }
});



// 🚀 サーバーを起動
const PORT = 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    });
});
