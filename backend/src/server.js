require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const sql = require("mssql"); // ✅ 変数名を `sql` に統一

const app = express();
const router = express.Router();

app.use(cors());
app.use(bodyParser.json());
app.use("/api", router);

// ✅ 環境変数からDB接続情報を取得
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
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

router.get("/transaction-history", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const { startDate } = req.query;

        if (!startDate) {
            return res.status(400).json({ error: "❌ `startDate` パラメータが必要です。" });
        }

        console.log(`📌 ストアドプロシージャ GetTransactionHistory を実行: StartDate=${startDate}`);

        const result = await pool.request()
            .input("StartDate", sql.Date, startDate)
            .execute("GetTransactionHistory");  // ✅ ストアドプロシージャを正しく呼び出す

        console.log("📌 SQL 結果:", result.recordset);

        res.json({ transactions: result.recordset });
    } catch (error) {
        console.error("❌ 取引履歴取得エラー:", error);
        res.status(500).json({ error: "取引履歴の取得に失敗しました" });
    }
});


router.post("/insert-transaction", async (req, res) => {
    try {
        console.log("📌 受信したリクエストデータ:", JSON.stringify(req.body, null, 2));

        const pool = await sql.connect(config);
        const request = pool.request();

        console.log("📌 SQL に送るパラメータ: ", {
            TransactionDate: req.body.TransactionDate,
            TransactionType: req.body.TransactionType,
            Amount: req.body.Amount,
            Summary: req.body.Summary,
            Memo: req.body.Memo,
            Recipient: req.body.Recipient,
            TenThousandYen: req.body.TenThousandYen,
            FiveThousandYen: req.body.FiveThousandYen,
            OneThousandYen: req.body.OneThousandYen,
            FiveHundredYen: req.body.FiveHundredYen,
            OneHundredYen: req.body.OneHundredYen,
            FiftyYen: req.body.FiftyYen,
            TenYen: req.body.TenYen,
            FiveYen: req.body.FiveYen,
            OneYen: req.body.OneYen
        });

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

        console.log("📌 SQL 実行前...");

        const result = await request.execute("dbo.InsertAndCalculateTransaction");

        if (!result.recordset || result.recordset.length === 0) {
            console.warn("⚠️ SQL の結果が空！データが正しく挿入されていない可能性あり！");
        } else {
            console.log("📌 SQL 実行結果:", JSON.stringify(result.recordset, null, 2));
        }

        res.json({ success: true, message: "取引が正常に登録されました", data: result.recordset });

    } catch (err) {
        console.error("❌ SQL 実行エラー:", err);
        res.status(500).json({ 
            success: false, 
            message: "データ登録に失敗しました", 
            error: err.message, 
            stack: err.stack 
        });
    }
});


// ✅ `/api/current-inventory` - 最新の金庫状態を取得
router.get("/current-inventory", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().execute("dbo.CalculateCurrentInventory");

        res.json(result.recordsets[0][0]); // 最初のレコードセットを返す
    } catch (err) {
        console.error("❌ 在庫取得エラー:", err);
        res.status(500).json({ error: "金庫状態の取得に失敗しました" });
    }
});

// ✅ `/api/calculate-carryover` - 指定日付の繰越金額を計算
router.get("/calculate-carryover", async (req, res) => {
    const startDate = req.query.startDate;

    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input("StartDate", sql.Date, startDate);

        const result = await request.execute("CalculateCarryOver");
        res.json(result.recordset);
    } catch (err) {
        console.error("❌ ストアドプロシージャ実行エラー:", err);
        res.status(500).json({ error: "データベースエラー" });
    }
});

// ✅ `/api/transactions/:id` - 取引を更新
router.put("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    const { TransactionType, Amount, Summary, Memo, Recipient, ...denominations } = req.body;

    const pool = await sql.connect(config);
    const request = pool.request();

    request.input("Id", sql.Int, id);
    request.input("TransactionType", sql.NVarChar, TransactionType);
    request.input("Amount", sql.Int, Amount);
    request.input("Summary", sql.NVarChar, Summary);
    request.input("Memo", sql.NVarChar, Memo);
    request.input("Recipient", sql.NVarChar, Recipient);

    const query = `
        UPDATE Transactions
        SET 
            TransactionType = @TransactionType,
            Amount = @Amount,
            Summary = @Summary,
            Memo = @Memo,
            Recipient = @Recipient
        WHERE Id = @Id
    `;

    try {
        await request.query(query);
        res.json({ message: "✅ 取引を修正しました" });
    } catch (error) {
        console.error("❌ 更新エラー:", error);
        res.status(500).json({ error: "データ更新に失敗しました" });
    }
});

router.delete("/transactions/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(config);
        const request = pool.request();
        request.input("TransactionID", sql.Int, id);

        // ✅ ストアドプロシージャを実行
        await request.execute("DeleteTransactionAndDenomination");

        res.json({ message: "✅ 取引を削除しました" });
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
