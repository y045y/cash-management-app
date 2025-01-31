require("dotenv").config();
const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 環境変数からDB接続情報を取得
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433, // デフォルトポート指定
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
        process.exit(1);
    }
};
app.get("/api/transactions", async (req, res) => {
    try {
        const result = await sql.query(`
            SELECT 
                Id, 
                TransactionDate, 
                TransactionType, 
                Amount, 
                Summary, 
                Memo, 
                Recipient,
                JSON_QUERY(DenominationJson) AS DenominationJson  -- ✅ JSON形式で取得
            FROM Transactions
            ORDER BY TransactionDate DESC;
        `);

        // `DenominationJson` をパースしてバックスラッシュを削除
        const transactions = result.recordset.map(tx => ({
            ...tx,
            DenominationJson: JSON.parse(tx.DenominationJson || "{}")  // ✅ JSONオブジェクトに変換
        }));

        res.json(transactions);
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});

app.post("/api/transactions", async (req, res) => {
    try {
        const {
            TransactionDate, TransactionType, Amount, Summary, Memo, Recipient,
            TenThousandYen, FiveThousandYen, OneThousandYen,
            FiveHundredYen, OneHundredYen, FiftyYen,
            TenYen, FiveYen, OneYen
        } = req.body;

        // ✅ 金種データを JSON に変換
        const denominationJson = JSON.stringify({
            "10000": TenThousandYen || 0,
            "5000": FiveThousandYen || 0,
            "1000": OneThousandYen || 0,
            "500": FiveHundredYen || 0,
            "100": OneHundredYen || 0,
            "50": FiftyYen || 0,
            "10": TenYen || 0,
            "5": FiveYen || 0,
            "1": OneYen || 0
        });

        // ✅ SQL にデータを挿入
        await sql.query(`
            INSERT INTO Transactions (TransactionDate, TransactionType, Amount, Summary, Memo, Recipient, DenominationJson)
            VALUES ('${TransactionDate}', '${TransactionType}', ${Amount}, '${Summary}', '${Memo}', '${Recipient}', '${denominationJson}')
        `);

        res.status(201).json({ message: "✅ 取引が追加されました" });
    } catch (err) {
        console.error("❌ データ挿入エラー:", err);
        res.status(500).json({ error: "データ登録に失敗しました" });
    }
});

// ✅ `/api/cashstate` - `CalculateCurrentInventory` ストアドを実行
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

// ✅ `/api/history` - 取引履歴を取得し、DenominationJson を JSON にパース
app.get("/api/history", async (req, res) => {
    try {
        const result = await sql.query("EXEC CalculateTransactionHistory");

        // ✅ JSON をパース
        const transactions = result.recordset.map((item) => ({
            ...item,
            DenominationJson: item.DenominationJson ? JSON.parse(item.DenominationJson) : {}
        }));

        res.json(transactions);
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});

app.get("/api/lastmonth", async (req, res) => {
    try {
        // 現在の日時を取得
        const today = new Date();
        
        // 前月の最終日を求める
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0); // 前月の最終日
        const lastMonthEndDate = lastMonth.toISOString().split("T")[0]; // YYYY-MM-DD 形式

        // 最も新しい取引データを取得（前月の最後の取引）
        const result = await sql.query(`
            SELECT TOP 1 * FROM Transactions
            WHERE FORMAT(TransactionDate, 'yyyy-MM-dd') <= '${lastMonthEndDate}'
            ORDER BY TransactionDate DESC
        `);

        if (result.recordset.length === 0) {
            return res.json({
                TotalBalance: 0,
                TenThousandYen: 0,
                FiveThousandYen: 0,
                OneThousandYen: 0,
                FiveHundredYen: 0,
                OneHundredYen: 0,
                FiftyYen: 0,
                TenYen: 0,
                FiveYen: 0,
                OneYen: 0
            });
        }

        // 繰越データを取得
        const lastData = result.recordset[0];

        res.json({
            TotalBalance: lastData.TotalBalance || 0,
            TenThousandYen: lastData.TenThousandYen || 0,
            FiveThousandYen: lastData.FiveThousandYen || 0,
            OneThousandYen: lastData.OneThousandYen || 0,
            FiveHundredYen: lastData.FiveHundredYen || 0,
            OneHundredYen: lastData.OneHundredYen || 0,
            FiftyYen: lastData.FiftyYen || 0,
            TenYen: lastData.TenYen || 0,
            FiveYen: lastData.FiveYen || 0,
            OneYen: lastData.OneYen || 0
        });
    } catch (err) {
        console.error("❌ 繰越データ取得エラー:", err);
        res.status(500).json({ error: "繰越データの取得に失敗しました" });
    }
});

// ✅ `/api/transactions/:id` - 取引を更新（🔥 SQL Injection 防止）
app.put("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { TransactionType, Amount, Summary, Memo, Recipient, ...denominations } = req.body;

    const denominationJson = JSON.stringify({
        "10000": denominations.TenThousandYen || 0,
        "5000": denominations.FiveThousandYen || 0,
        "1000": denominations.OneThousandYen || 0,
        "500": denominations.FiveHundredYen || 0,
        "100": denominations.OneHundredYen || 0,
        "50": denominations.FiftyYen || 0,
        "10": denominations.TenYen || 0,
        "5": denominations.FiveYen || 0,
        "1": denominations.OneYen || 0
    });

    try {
        await sql.query(`
            UPDATE Transactions
            SET TransactionType = '${TransactionType}',
                DenominationJson = '${denominationJson}',
                Amount = ${Amount},
                Summary = '${Summary}',
                Memo = '${Memo}',
                Recipient = '${Recipient}'
            WHERE Id = ${id}
        `);

        res.json({ message: "✅ 取引を修正しました" });
    } catch (error) {
        console.error("❌ 更新エラー:", error);
        res.status(500).json({ error: "データ更新に失敗しました" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    const { id } = req.params;

    try {
        // ✅ 削除対象のレコードが存在するか確認
        const checkExists = await sql.query(`SELECT COUNT(*) AS count FROM Transactions WHERE Id = ${id}`);
        if (checkExists.recordset[0].count === 0) {
            return res.status(404).json({ error: "❌ 指定された取引が見つかりません" });
        }

        // ✅ 取引を削除
        await sql.query(`DELETE FROM Transactions WHERE Id = ${id}`);

        // ✅ `TotalBalance` を再計算
        await sql.query("EXEC CalculateTransactionHistory");

        // ✅ `CurrentInventory` も再計算
        await sql.query("EXEC CalculateCurrentInventory");

        res.json({ message: "✅ 取引を削除し、履歴・在庫情報を更新しました" });
    } catch (err) {
        console.error("❌ 削除エラー:", err);
        res.status(500).json({ error: "データ削除に失敗しました" });
    }
});


// ✅ サーバー起動
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    });
});
