require("dotenv").config();
const multer = require("multer");
const fs = require('fs');
const csv = require('csv-parser');
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
// multer 設定：アップロードされたファイルを処理
const upload = multer({ dest: 'uploads/' }); // ファイルを uploads フォルダに保存

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

router.get("/export-denominations", async (req, res) => {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request()
            .query(`
                SELECT
                    t.Id AS TransactionId,
                    t.TransactionDate,
                    t.TransactionType,
                    t.Amount,
                    t.Summary,
                    t.Recipient,
                    t.Memo,
                    d.TenThousandYen,
                    d.FiveThousandYen,
                    d.OneThousandYen,
                    d.FiveHundredYen,
                    d.OneHundredYen,
                    d.FiftyYen,
                    d.TenYen,
                    d.FiveYen,
                    d.OneYen
                FROM Transactions t
                LEFT JOIN Denomination d ON t.Id = d.TransactionId;
            `);

        // ヘッダーをデータベースカラム名に合わせる
        const bom = '\uFEFF';
        let csvData = 'TransactionId,TransactionDate,TransactionType,Amount,Summary,Recipient,Memo,TenThousandYen,FiveThousandYen,OneThousandYen,FiveHundredYen,OneHundredYen,FiftyYen,TenYen,FiveYen,OneYen\n';

        // データをCSV形式に変換
        result.recordset.forEach(row => {
            const dateObj = new Date(row.TransactionDate);
            const formattedDate = `${dateObj.getFullYear()}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')}`;

            csvData += `${row.TransactionId},${formattedDate},${row.TransactionType},${row.Amount},${row.Summary},${row.Recipient},${row.Memo},${row.TenThousandYen},${row.FiveThousandYen},${row.OneThousandYen},${row.FiveHundredYen},${row.OneHundredYen},${row.FiftyYen},${row.TenYen},${row.FiveYen},${row.OneYen}\n`;
        });

        // レスポンスヘッダを設定
        res.header("Content-Type", "text/csv; charset=utf-8");
        res.attachment("denominations.csv");
        res.send(bom + csvData);

    } catch (err) {
        console.error("❌ CSV出力エラー:", err);
        res.status(500).send("CSV出力に失敗しました");
    }
});



router.post('/import-csv', upload.single('file'), async (req, res) => {
    const transactions = [];
    const denominations = [];

    const filePath = req.file.path;

    const parseDate = (dateStr) => {
        if (!dateStr) return null; // 空の場合はnullを返す
        const [year, month, day] = dateStr.split('/').map(Number);
        return new Date(year, month - 1, day);
    };

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
            const transaction = {
                TransactionId: parseInt(row.TransactionId),
                TransactionDate: parseDate(row.TransactionDate),
                TransactionType: row.TransactionType,
                Amount: parseInt(row.Amount),
                Summary: row.Summary,
                Recipient: row.Recipient,
                Memo: row.Memo,
            };

            const denomination = {
                TransactionId: parseInt(row.TransactionId),
                TenThousandYen: parseInt(row.TenThousandYen) || 0,
                FiveThousandYen: parseInt(row.FiveThousandYen) || 0,
                OneThousandYen: parseInt(row.OneThousandYen) || 0,
                FiveHundredYen: parseInt(row.FiveHundredYen) || 0,
                OneHundredYen: parseInt(row.OneHundredYen) || 0,
                FiftyYen: parseInt(row.FiftyYen) || 0,
                TenYen: parseInt(row.TenYen) || 0,
                FiveYen: parseInt(row.FiveYen) || 0,
                OneYen: parseInt(row.OneYen) || 0,
            };

            transactions.push(transaction);
            denominations.push(denomination);
        })
        .on('end', async () => {
            const pool = await sql.connect(config);
            const transaction = pool.transaction();

            try {
                await transaction.begin();

                for (const t of transactions) {
                    const transactionResult = await transaction.request()
                        .input('TransactionDate', sql.Date, t.TransactionDate || null)
                        .input('TransactionType', sql.NVarChar, t.TransactionType)
                        .input('Amount', sql.Int, t.Amount)
                        .input('Summary', sql.NVarChar, t.Summary)
                        .input('Recipient', sql.NVarChar, t.Recipient)
                        .input('Memo', sql.NVarChar, t.Memo)
                        .query(`
                            INSERT INTO Transactions (TransactionDate, TransactionType, Amount, Summary, Recipient, Memo)
                            OUTPUT INSERTED.Id
                            VALUES (@TransactionDate, @TransactionType, @Amount, @Summary, @Recipient, @Memo)
                        `);

                    const insertedId = transactionResult.recordset[0].Id;

                    const d = denominations.find(d => d.TransactionId === t.TransactionId);
                    if (d) {
                        await transaction.request()
                            .input('TransactionId', sql.Int, insertedId)
                            .input('TenThousandYen', sql.Int, d.TenThousandYen)
                            .input('FiveThousandYen', sql.Int, d.FiveThousandYen)
                            .input('OneThousandYen', sql.Int, d.OneThousandYen)
                            .input('FiveHundredYen', sql.Int, d.FiveHundredYen)
                            .input('OneHundredYen', sql.Int, d.OneHundredYen)
                            .input('FiftyYen', sql.Int, d.FiftyYen)
                            .input('TenYen', sql.Int, d.TenYen)
                            .input('FiveYen', sql.Int, d.FiveYen)
                            .input('OneYen', sql.Int, d.OneYen)
                            .query(`
                                INSERT INTO Denomination (TransactionId, TenThousandYen, FiveThousandYen, OneThousandYen, FiveHundredYen, OneHundredYen, FiftyYen, TenYen, FiveYen, OneYen)
                                VALUES (@TransactionId, @TenThousandYen, @FiveThousandYen, @OneThousandYen, @FiveHundredYen, @OneHundredYen, @FiftyYen, @TenYen, @FiveYen, @OneYen)
                            `);
                    }
                }

                await transaction.commit();

                res.status(200).send('CSVデータが正常にインポートされました');
            } catch (err) {
                await transaction.rollback();
                console.error('❌ データベース挿入エラー:', err);
                res.status(500).send('インポートに失敗しました');
            } finally {
                fs.unlinkSync(filePath);
            }
        })
        .on('error', (err) => {
            console.error('❌ CSVファイルの読み込みエラー:', err);
            res.status(500).send('CSVファイルの読み込みに失敗しました');
        });
});

// サーバー起動処理
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
    });
});
