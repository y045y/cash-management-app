const sql = require('mssql');

// 履歴取得
const getHistory = async (req, res) => {
    try {
        const pool = await sql.connect(process.env.DB_CONFIG);
        const result = await pool.request().query(`
            SELECT 
                T.TransactionID, T.TransactionDate, T.Amount, T.TransactionType, 
                T.Description, T.Recipient, T.Memo, T.TotalBalance, T.Difference,
                C.DenominationID, C.Quantity
            FROM TransactionLog T
            LEFT JOIN Cashbox C ON T.TransactionID = C.TransactionID
            ORDER BY T.TransactionDate DESC
        `);

        // データ整形
        const formattedResult = result.recordset.reduce((acc, row) => {
            const transaction = acc.find(t => t.TransactionID === row.TransactionID);

            if (!transaction) {
                acc.push({
                    TransactionID: row.TransactionID,
                    TransactionDate: row.TransactionDate,
                    Amount: row.Amount,
                    TransactionType: row.TransactionType,
                    Description: row.Description,
                    Recipient: row.Recipient,
                    Memo: row.Memo,
                    TotalBalance: row.TotalBalance,
                    Difference: row.Difference,
                    CashState: {
                        [row.DenominationID]: row.Quantity,
                    },
                });
            } else {
                transaction.CashState[row.DenominationID] = row.Quantity;
            }

            return acc;
        }, []);

        res.json(formattedResult);
    } catch (error) {
        console.error('❌ 履歴取得エラー:', error);
        res.status(500).send('履歴の取得に失敗しました: ' + error.message);
    }
};

// 履歴追加
const addHistory = async (req, res) => {
    try {
        const { TransactionDate, Amount, TransactionType, Description, Recipient, Memo, CashState } = req.body;

        const pool = await sql.connect(process.env.DB_CONFIG);

        // TransactionLogにデータ追加
        const result = await pool.request()
            .input('TransactionDate', sql.Date, TransactionDate)
            .input('Amount', sql.Int, Amount)
            .input('TransactionType', sql.NVarChar, TransactionType)
            .input('Description', sql.NVarChar, Description)
            .input('Recipient', sql.NVarChar, Recipient)
            .input('Memo', sql.NVarChar, Memo)
            .query(`
                INSERT INTO TransactionLog (TransactionDate, Amount, TransactionType, Description, Recipient, Memo)
                OUTPUT INSERTED.TransactionID
                VALUES (@TransactionDate, @Amount, @TransactionType, @Description, @Recipient, @Memo)
            `);

        const transactionID = result.recordset[0].TransactionID;

        // Cashboxに金種データを追加
        for (const [denominationID, quantity] of Object.entries(CashState)) {
            await pool.request()
                .input('TransactionID', sql.Int, transactionID)
                .input('DenominationID', sql.Int, denominationID)
                .input('Quantity', sql.Int, quantity)
                .query(`
                    INSERT INTO Cashbox (TransactionID, DenominationID, Quantity)
                    VALUES (@TransactionID, @DenominationID, @Quantity)
                `);
        }

        res.status(201).send('✅ 履歴が正常に追加されました');
    } catch (error) {
        console.error('❌ 履歴追加エラー:', error);
        res.status(500).send('履歴の追加に失敗しました: ' + error.message);
    }
};

module.exports = {
    getHistory,
    addHistory,
};
