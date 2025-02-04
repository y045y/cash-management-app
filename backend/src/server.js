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
// 取引履歴の取得エンドポイント

// ✅ `/api/transaction-history` - 指定された日付の取引履歴を取得
app.get('/api/transaction-history', async (req, res) => {
    const startDate = req.query.startDate;

    if (!startDate) {
        return res.status(400).json({ error: "❌ `startDate` パラメータが必要です" });
    }

    try {
        // ✅ アプリ起動時に接続したプールを使用
        const pool = await sql.connect(config);

        // ✅ ストアドプロシージャを実行
        const result = await pool.request()
            .input('StartDate', sql.Date, startDate)
            .execute('GetTransactionHistory');

        res.json({ transactions: result.recordset });
    } catch (err) {
        console.error("❌ データ取得エラー:", err);
        res.status(500).json({ error: "データベースエラー" });
    }
});

app.post("/api/insert-transaction", async (req, res) => {
    try {
        console.log("📌 受信データ:", req.body); // デバッグログ

        const {
            TransactionDate, TransactionType, Amount, Summary, Memo, Recipient,
            TenThousandYen, FiveThousandYen, OneThousandYen,
            FiveHundredYen, OneHundredYen, FiftyYen,
            TenYen, FiveYen, OneYen
        } = req.body;

        // ✅ ストアドプロシージャを実行
        const pool = await sql.connect(config);
        const result = await pool.request()
            .input('TransactionDate', sql.DateTime2(3), TransactionDate)
            .input('TransactionType', sql.NVarChar(50), TransactionType)
            .input('Amount', sql.Int, Amount)
            .input('Summary', sql.NVarChar(255), Summary)
            .input('Memo', sql.NVarChar(255), Memo)
            .input('Recipient', sql.NVarChar(255), Recipient)
            .input('TenThousandYen', sql.Int, TenThousandYen)
            .input('FiveThousandYen', sql.Int, FiveThousandYen)
            .input('OneThousandYen', sql.Int, OneThousandYen)
            .input('FiveHundredYen', sql.Int, FiveHundredYen)
            .input('OneHundredYen', sql.Int, OneHundredYen)
            .input('FiftyYen', sql.Int, FiftyYen)
            .input('TenYen', sql.Int, TenYen)
            .input('FiveYen', sql.Int, FiveYen)
            .input('OneYen', sql.Int, OneYen)
            .execute('InsertTransactionAndDenomination');

        console.log("✅ データ挿入成功:", result);

        res.status(201).json({ message: "✅ 取引が追加されました" });
    } catch (err) {
        console.error("❌ データ挿入エラー:", err);
        res.status(500).json({ error: "データ登録に失敗しました" });
    }
});

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
        console.log("📌 受信データ:", req.body);  // ← リクエストボディの内容をログに出力

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

        console.log("📌 変換後の DenominationJson:", denominationJson);  // ← JSON データが正しいかログ出力

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

app.get('/api/current-inventory', async (req, res) => {
    try {
      // MSSQL接続
      const pool = await sql.connect(config);
      
      // ストアドプロシージャの呼び出し
      const result = await pool.request()
        .execute("dbo.CalculateCurrentInventory");
      
      // データをフロントに返す
      res.json(result.recordsets[0][0]);  // 最初のレコードセットを返す
    } catch (err) {
      console.error("Error executing stored procedure: ", err);
      res.status(500).send("Internal Server Error");
    }
  });
  app.get('/api/calculate-carryover', async (req, res) => {
    const startDate = req.query.startDate;  

    try {
        // SQL Server データベース接続（環境変数を使用）
        const pool = await sql.connect({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            server: process.env.DB_SERVER,
            database: process.env.DB_DATABASE,
        });

        const result = await pool.request()
            .input('StartDate', sql.Date, startDate)
            .execute('CalculateCarryOver');

        res.json(result.recordset);

        pool.close();
    } catch (err) {
        console.error('ストアドプロシージャ実行エラー:', err);
        res.status(500).json({ error: 'データベースエラー' });
    }
});

// ✅ `/api/history` - 指定された月の取引履歴を取得
app.get("/api/history", async (req, res) => {
    const { month } = req.query; // YYYY-MM の形式で取得

    if (!month) {
        return res.status(400).json({ error: "❌ `month` パラメータが必要です" });
    }

    try {
        // `CalculateTransactionHistory` を実行（ストアドプロシージャ）
        const result = await sql.query(`EXEC CalculateTransactionHistory`);

        // ✅ 受け取ったデータをフィルタリング（該当月のみ取得）
        const transactions = result.recordset
            .map(item => ({
                ...item,
                TransactionDate: item.TransactionDate.toISOString().split("T")[0], // YYYY-MM-DD
                DenominationJson: item.DenominationJson ? JSON.parse(item.DenominationJson) : {}
            }))
            .filter(item => item.TransactionDate.startsWith(month)); // YYYY-MM に一致するもののみ取得

        console.log(`📅 ${month} の履歴データ取得:`, transactions);

        res.json(transactions);
    } catch (err) {
        console.error("❌ SQL エラー:", err);
        res.status(500).json({ error: "データ取得に失敗しました" });
    }
});
// app.get("/api/lastmonth", async (req, res) => {
//     try {
//         const result = await sql.query("EXEC CalculateLastTransaction");

//         if (result.recordset.length === 0) {
//             return res.json({
//                 TotalBalance: 0,
//                 TenThousandYen: 0,
//                 FiveThousandYen: 0,
//                 OneThousandYen: 0,
//                 FiveHundredYen: 0,
//                 OneHundredYen: 0,
//                 FiftyYen: 0,
//                 TenYen: 0,
//                 FiveYen: 0,
//                 OneYen: 0
//             });
//         }

//         // JSONをパース
//         const lastData = result.recordset[0];

//         res.json({
//             TotalBalance: lastData.TotalBalance || 0,
//             TenThousandYen: lastData.TenThousandYen || 0,
//             FiveThousandYen: lastData.FiveThousandYen || 0,
//             OneThousandYen: lastData.OneThousandYen || 0,
//             FiveHundredYen: lastData.FiveHundredYen || 0,
//             OneHundredYen: lastData.OneHundredYen || 0,
//             FiftyYen: lastData.FiftyYen || 0,
//             TenYen: lastData.TenYen || 0,
//             FiveYen: lastData.FiveYen || 0,
//             OneYen: lastData.OneYen || 0
//         });
//     } catch (err) {
//         console.error("❌ 繰越データ取得エラー:", err);
//         res.status(500).json({ error: "繰越データの取得に失敗しました" });
//     }
// });

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
