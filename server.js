require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql");
const path = require("path");

// アプリ本体・ルーター定義
const app = express();
const router = express.Router();

// CORS設定
const corsOptions = {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use("/api", router);

// Reactビルド済みファイルの提供（frontend/build が backend に配置される前提）
app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
});

// 環境変数からSQL Server接続情報取得
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: true, // Azure SQLの推奨設定
        trustServerCertificate: true, // 開発環境で必要なケースあり
    },
};

// SQL Server 接続関数
const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log("✅ SQL Server に接続成功");
    } catch (err) {
        console.error("❌ SQL Server 接続エラー:", err);
        process.exit(1); // 致命的エラーの場合、プロセス終了
    }
};

// 🔽 APIルート定義 ─────────────────────────────────

// ① 取引履歴取得API
router.get("/transaction-history", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const { startDate } = req.query;

        if (!startDate) {
            return res.status(400).json({ error: "❌ `startDate` パラメータが必要です。" });
        }

        const result = await pool.request()
            .input("StartDate", sql.Date, startDate)
            .execute("GetTransactionHistory");

        res.json({ transactions: result.recordset });
    } catch (error) {
        console.error("❌ 取引履歴取得エラー:", error);
        res.status(500).json({ error: "取引履歴の取得に失敗しました" });
    }
});

// ② 取引データ登録API
router.post("/insert-transaction", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const request = pool.request();

        // リクエストボディから各値を取得してパラメータとして渡す
        request.input("TransactionDate", sql.DateTime, req.body.TransactionDate);
        request.input("TransactionType", sql.NVarChar, req.body.TransactionType);
        request.input("Amount", sql.Int, req.body.Amount);
        request.input("Summary", sql.NVarChar, req.body.Summary);
        request.input("Memo", sql.NVarChar, req.body.Memo);
        request.input("Recipient", sql.NVarChar, req.body.Recipient);

        request.input("TenThousandYen", sql.Int, req.body.TenThousandYen || 0);
        request.input("FiveThousandYen", sql.Int, req.body.FiveThousandYen || 0);
        request.input("OneThousandYen", sql.Int, req.body.OneThousandYen || 0);
        request.input("FiveHundredYen", sql.Int, req.body.FiveHundredYen || 0);
        request.input("OneHundredYen", sql.Int, req.body.OneHundredYen || 0);
        request.input("FiftyYen", sql.Int, req.body.FiftyYen || 0);
        request.input("TenYen", sql.Int, req.body.TenYen || 0);
        request.input("FiveYen", sql.Int, req.body.FiveYen || 0);
        request.input("OneYen", sql.Int, req.body.OneYen || 0);

        const result = await request.execute("dbo.InsertAndCalculateTransaction");

        res.json({ success: true, message: "取引が正常に登録されました", data: result.recordset });
    } catch (err) {
        console.error("❌ データ登録エラー:", err);
        res.status(500).json({ error: "データ登録に失敗しました" });
    }
});

// ③ 最新金庫状態取得API
router.get("/current-inventory", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().execute("dbo.CalculateCurrentInventory");

        res.json(result.recordsets[0][0]);
    } catch (err) {
        console.error("❌ 在庫取得エラー:", err);
        res.status(500).json({ error: "金庫状態の取得に失敗しました" });
    }
});

// ④ 指定日の繰越金額計算API
router.get("/calculate-carryover", async (req, res) => {
    const { startDate } = req.query;
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input("StartDate", sql.Date, startDate)
            .execute("CalculateCarryOver");

        res.json(result.recordset);
    } catch (err) {
        console.error("❌ 繰越計算エラー:", err);
        res.status(500).json({ error: "繰越計算に失敗しました" });
    }
});

// ⑤ 取引データ更新API
router.put("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { TransactionType, Amount, Summary, Memo, Recipient } = req.body;

    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("Id", sql.Int, id)
            .input("TransactionType", sql.NVarChar, TransactionType)
            .input("Amount", sql.Int, Amount)
            .input("Summary", sql.NVarChar, Summary)
            .input("Memo", sql.NVarChar, Memo)
            .input("Recipient", sql.NVarChar, Recipient)
            .query(`
                UPDATE Transactions
                SET TransactionType = @TransactionType,
                    Amount = @Amount,
                    Summary = @Summary,
                    Memo = @Memo,
                    Recipient = @Recipient
                WHERE Id = @Id
            `);

        res.json({ message: "✅ 取引を更新しました" });
    } catch (error) {
        console.error("❌ 更新エラー:", error);
        res.status(500).json({ error: "データ更新に失敗しました" });
    }
});

// ⑥ 取引データ削除API
router.delete("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(config);
        await pool.request()
            .input("TransactionID", sql.Int, id)
            .execute("DeleteTransactionAndDenomination");

        res.json({ message: "✅ 取引を削除しました" });
    } catch (err) {
        console.error("❌ 削除エラー:", err);
        res.status(500).json({ error: "データ削除に失敗しました" });
    }
});
// サーバー起動処理の手前あたり
app.get("/", (req, res) => {
    res.send("OK");
});


// サーバー起動処理
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    });
});
