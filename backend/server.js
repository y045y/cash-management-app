// 必要なモジュールをインポート
const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションのインスタンスを作成
const app = express();

// CORS設定: 特定のドメインを許可する例
const allowedOrigins = ['https://wonderful-forest-0e74fb500-4.azurestaticapps.net', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },

};

// CORSを全てのルートに適用
app.use(cors(corsOptions));

// ミドルウェア設定
app.use(express.json());

// ========================
// データベース接続設定
// ========================
const dbConfig = {
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    server: process.env.DB_SERVER , // Azure SQL Server
    database: process.env.DB_DATABASE ,
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};

let pool;

// データベース接続
sql.connect(dbConfig)
    .then((p) => {
        pool = p;
        console.log('✅ データベース接続成功');
    })
    .catch((err) => {
        console.error('❌ データベース接続エラー:', err);
        process.exit(1);
    });

// ========================
// ルート設定
// ========================

// 履歴の取得
app.get('/api/history', async (req, res) => {
    try {
        const { year, month } = req.query;

        if (!year || !month || isNaN(year) || isNaN(month)) {
            return res.status(400).json({ message: 'year と month は必須で、数値である必要があります' });
        }

        // SQLクエリでデータを取得
        const result = await pool.request()
            .input('year', sql.Int, parseInt(year, 10))
            .input('month', sql.Int, parseInt(month, 10))
            .query(`
                SELECT 
                    TransactionID,
                    TransactionDate,
                    Amount,
                    TransactionType,
                    Description,
                    Recipient,
                    Memo,
                    TotalAmount,
                    TotalBalance,
                    TenThousandYen,
                    FiveThousandYen,
                    OneThousandYen,
                    FiveHundredYen,
                    OneHundredYen,
                    FiftyYen,
                    TenYen,
                    FiveYen,
                    OneYen
                FROM TransactionLog
                WHERE YEAR(TransactionDate) = @year AND MONTH(TransactionDate) = @month
                ORDER BY TransactionDate DESC, TransactionID DESC
            `);

        // 結果をそのまま返す
        res.status(200).json(result.recordset);
    } catch (error) {
        console.error('履歴取得エラー:', error);
        res.status(500).json({ message: '履歴取得中にエラーが発生しました' });
    }
});

// 履歴削除
app.delete('/api/history/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 入力バリデーション
        if (!id || !Number.isInteger(Number(id))) {
            return res.status(400).json({ message: '有効な整数の TransactionID を指定してください' });
        }

        // 存在確認
        const existsCheck = await pool.request()
            .input('TransactionID', sql.Int, parseInt(id, 10))
            .query(`SELECT COUNT(*) AS count FROM TransactionLog WHERE TransactionID = @TransactionID`);

        if (existsCheck.recordset[0].count === 0) {
            return res.status(404).json({ message: '指定された履歴は存在しません' });
        }

        // 削除クエリを実行
        await pool.request()
            .input('TransactionID', sql.Int, parseInt(id, 10))
            .query(`DELETE FROM TransactionLog WHERE TransactionID = @TransactionID`);

        res.status(200).json({
            message: '履歴が正常に削除されました',
        });
    } catch (error) {
        console.error('履歴削除エラー詳細:', {
            message: error.message,
            stack: error.stack,
        });
        res.status(500).json({ 
            message: '履歴削除中にエラーが発生しました', 
            error: error.message 
        });
    }
});

// 金庫状態取得
app.get('/api/cashState', async (req, res) => {
    try {
        const result = await pool.request()
            .query('SELECT DenominationID, CurrentQuantity FROM Cashbox');

        const cashState = {};
        result.recordset.forEach(row => {
            cashState[row.DenominationID] = row.CurrentQuantity;
        });

        res.json(cashState);
    } catch (error) {
        console.error('金庫状態取得エラー:', error.message);
        res.status(500).json({ message: '金庫状態の取得中にエラーが発生しました' });
    }
});

// 清算処理
app.post('/api/settlement', async (req, res) => {
    try {
        const { TransactionDate, Amount, TransactionType, Description, Recipient, Memo, CashState } = req.body;

        if (!TransactionDate || typeof Amount !== 'number' || !TransactionType || !CashState || typeof CashState !== 'object') {
            return res.status(400).json({ message: '必要なデータが不足しています' });
        }
        
        // ストアドプロシージャを呼び出して金庫状態を更新
        const result = await pool.request()
            .input('TransactionDate', sql.Date, TransactionDate)
            .input('Amount', sql.Int, Amount)
            .input('TransactionType', sql.NVarChar(50), TransactionType)
            .input('Description', sql.NVarChar(255), Description)
            .input('Recipient', sql.NVarChar(255), Recipient)
            .input('Memo', sql.NVarChar(255), Memo)
            .input('CashState', sql.NVarChar(sql.MAX), JSON.stringify(CashState)) // JSON形式で渡す
            .execute('ProcessSettlement'); // ストアドプロシージャ名

        // ストアドプロシージャの結果を処理
        if (!result.recordset || result.recordset.length === 0) {
            throw new Error('ストアドプロシージャが結果を返しませんでした');
        }

        // 結果を整形してクライアントに返す
        const updatedCashState = result.recordset.reduce((acc, row) => {
            acc[row.DenominationID] = row.CurrentQuantity;
            return acc;
        }, {});

        res.status(201).json({
            message: '清算が正常に処理されました',
            cashState: updatedCashState,
        });
    } catch (error) {
        console.error('清算エラー詳細:', error);

        // SQL Serverが返したエラーメッセージを取得
        if (error.number === 50001) {
            return res.status(400).json({ message: error.message }); // 不足エラーなどの場合
        }

        res.status(500).json({ message: '清算中にエラーが発生しました' });
    }
});

// サーバー起動
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`🚀 サーバーが http://localhost:${port} で稼働中`);
});
