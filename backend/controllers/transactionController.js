// /controllers/transactionController.js
const { sql, config } = require("../config/db");
const fs = require("fs");
const csv = require("csv-parser");

const getTransactionHistory = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const { startDate } = req.query;

    if (!startDate) {
      return res
        .status(400)
        .json({ error: "❌ `startDate` パラメータが必要です。" });
    }

    const result = await pool
      .request()
      .input("StartDate", sql.Date, startDate)
      .execute("GetTransactionHistory");

    res.json({ transactions: result.recordset });
  } catch (error) {
    console.error("❌ 取引履歴取得エラー:", error);
    res.status(500).json({ error: "取引履歴の取得に失敗しました" });
  }
};

const insertTransaction = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const request = pool.request();

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

    res.json({
      success: true,
      message: "取引が正常に登録されました",
      data: result.recordset,
    });
  } catch (err) {
    console.error("❌ データ登録エラー:", err);
    res.status(500).json({ error: "データ登録に失敗しました" });
  }
};

const getCurrentInventory = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .execute("dbo.CalculateCurrentInventory");

    res.json(result.recordsets[0][0]);
  } catch (err) {
    console.error("❌ 在庫取得エラー:", err);
    res.status(500).json({ error: "金庫状態の取得に失敗しました" });
  }
};

const calculateCarryover = async (req, res) => {
  const { startDate } = req.query;
  try {
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .input("StartDate", sql.Date, startDate)
      .execute("CalculateCarryOver");

    res.json(result.recordset);
  } catch (err) {
    console.error("❌ 繰越計算エラー:", err);
    res.status(500).json({ error: "繰越計算に失敗しました" });
  }
};

const updateTransactionBasic = async (req, res) => {
  const { id } = req.params;
  const { TransactionType, Amount, Summary, Memo, Recipient } = req.body;

  try {
    const pool = await sql.connect(config);
    await pool
      .request()
      .input("Id", sql.Int, id)
      .input("TransactionType", sql.NVarChar, TransactionType)
      .input("Amount", sql.Int, Amount)
      .input("Summary", sql.NVarChar, Summary)
      .input("Memo", sql.NVarChar, Memo)
      .input("Recipient", sql.NVarChar, Recipient).query(`
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
};

const deleteTransaction = async (req, res) => {
  const { id } = req.params;
  try {
    const pool = await sql.connect(config);
    await pool
      .request()
      .input("TransactionID", sql.Int, id)
      .execute("DeleteTransactionAndDenomination");

    res.json({ message: "✅ 取引を削除しました" });
  } catch (err) {
    console.error("❌ 削除エラー:", err);
    res.status(500).json({ error: "データ削除に失敗しました" });
  }
};

const updateTransactionWithDenomination = async (req, res) => {
  const { id } = req.params;
  const {
    TransactionDate,
    TransactionType,
    Amount,
    Summary,
    Recipient,
    Memo,
    TenThousandYen,
    FiveThousandYen,
    OneThousandYen,
    FiveHundredYen,
    OneHundredYen,
    FiftyYen,
    TenYen,
    FiveYen,
    OneYen,
  } = req.body;

  const pool = await sql.connect(config);
  let transaction;

  try {
    transaction = pool.transaction();
    await transaction.begin();

    await transaction
      .request()
      .input("Id", sql.Int, id)
      .input("TransactionDate", sql.DateTime2(3), TransactionDate)
      .input("TransactionType", sql.NVarChar, TransactionType)
      .input("Amount", sql.Int, Amount)
      .input("Summary", sql.NVarChar, Summary)
      .input("Recipient", sql.NVarChar, Recipient)
      .input("Memo", sql.NVarChar, Memo).query(`
        UPDATE Transactions
        SET TransactionDate = @TransactionDate, TransactionType = @TransactionType, Amount = @Amount,
            Summary = @Summary, Recipient = @Recipient, Memo = @Memo
        WHERE Id = @Id
      `);

    const denomExists = await transaction
      .request()
      .input("TransactionId", sql.Int, id)
      .query("SELECT 1 FROM Denomination WHERE TransactionId = @TransactionId");

    const reqq = transaction.request();
    reqq.input("TransactionId", sql.Int, id);
    reqq.input("TenThousandYen", sql.Int, TenThousandYen || 0);
    reqq.input("FiveThousandYen", sql.Int, FiveThousandYen || 0);
    reqq.input("OneThousandYen", sql.Int, OneThousandYen || 0);
    reqq.input("FiveHundredYen", sql.Int, FiveHundredYen || 0);
    reqq.input("OneHundredYen", sql.Int, OneHundredYen || 0);
    reqq.input("FiftyYen", sql.Int, FiftyYen || 0);
    reqq.input("TenYen", sql.Int, TenYen || 0);
    reqq.input("FiveYen", sql.Int, FiveYen || 0);
    reqq.input("OneYen", sql.Int, OneYen || 0);

    if (denomExists.recordset.length > 0) {
      await reqq.query(`
        UPDATE Denomination SET
          TenThousandYen = @TenThousandYen, FiveThousandYen = @FiveThousandYen, OneThousandYen = @OneThousandYen,
          FiveHundredYen = @FiveHundredYen, OneHundredYen = @OneHundredYen, FiftyYen = @FiftyYen,
          TenYen = @TenYen, FiveYen = @FiveYen, OneYen = @OneYen
        WHERE TransactionId = @TransactionId
      `);
    } else {
      await reqq.query(`
        INSERT INTO Denomination
        (TransactionId, TenThousandYen, FiveThousandYen, OneThousandYen, FiveHundredYen, OneHundredYen, FiftyYen, TenYen, FiveYen, OneYen)
        VALUES (@TransactionId, @TenThousandYen, @FiveThousandYen, @OneThousandYen, @FiveHundredYen, @OneHundredYen, @FiftyYen, @TenYen, @FiveYen, @OneYen)
      `);
    }

    await transaction.commit();
    res.status(200).json({ message: "取引更新成功" });
  } catch (err) {
    if (transaction && transaction._acquiredConnection)
      await transaction.rollback();
    console.error("更新エラー:", err);
    res.status(500).send("更新に失敗しました");
  }
};

const exportDenominations = async (req, res) => {
  try {
    const pool = await sql.connect(config);
    const result = await pool.request().query(`
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

    const bom = "\uFEFF";
    let csvData =
      "TransactionId,TransactionDate,TransactionType,Amount,Summary,Recipient,Memo,TenThousandYen,FiveThousandYen,OneThousandYen,FiveHundredYen,OneHundredYen,FiftyYen,TenYen,FiveYen,OneYen\n";

    const escapeCsv = (value) => {
      if (value == null) return "";
      const strValue = String(value);
      return strValue.includes(",") ||
        strValue.includes("\n") ||
        strValue.includes('"')
        ? `"${strValue.replace(/"/g, '""')}"`
        : strValue;
    };

    result.recordset.forEach((row) => {
      const formattedDate = row.TransactionDate
        ? new Date(row.TransactionDate)
            .toISOString()
            .split("T")[0]
            .replace(/-/g, "/")
        : "";

      csvData += `${row.TransactionId || ""},${formattedDate},${escapeCsv(
        row.TransactionType
      )},${row.Amount || ""},${escapeCsv(row.Summary)},${escapeCsv(
        row.Recipient
      )},${escapeCsv(row.Memo)},${row.TenThousandYen || 0},${
        row.FiveThousandYen || 0
      },${row.OneThousandYen || 0},${row.FiveHundredYen || 0},${
        row.OneHundredYen || 0
      },${row.FiftyYen || 0},${row.TenYen || 0},${row.FiveYen || 0},${
        row.OneYen || 0
      }\n`;
    });

    res.header("Content-Type", "text/csv; charset=utf-8");
    res.attachment("denominations.csv");
    res.send(bom + csvData);
  } catch (err) {
    console.error("❌ CSV出力エラー:", err);
    res.status(500).send("CSV出力に失敗しました");
  }
};

const importCsv = async (req, res) => {
  const transactions = [];
  const denominations = [];

  const filePath = req.file.path;

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const [year, month, day] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      const transactionId = parseInt(row.TransactionId);
      if (transactionId < 0) return;

      const transaction = {
        TransactionDate: parseDate(row.TransactionDate),
        TransactionType: row.TransactionType,
        Amount: row.Amount ? parseInt(row.Amount) : 0,
        Summary: row.Summary,
        Recipient: row.Recipient,
        Memo: row.Memo,
      };

      const denomination = {
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
    .on("end", async () => {
      const pool = await sql.connect(config);
      const transaction = pool.transaction();
      await transaction.begin();

      try {
        await transaction.request().query("DROP TABLE IF EXISTS Denomination");
        await transaction.request().query("DROP TABLE IF EXISTS Transactions");

        await transaction.request().query(`
          CREATE TABLE Transactions(
            Id INT IDENTITY(1,1) PRIMARY KEY,
            TransactionDate DATETIME2(3),
            TransactionType NVARCHAR(50),
            Amount INT,
            Summary NVARCHAR(255),
            Memo NVARCHAR(255),
            Recipient NVARCHAR(255),
            RunningBalance INT DEFAULT(0) NOT NULL
          )
        `);

        await transaction.request().query(`
          CREATE TABLE Denomination(
            TransactionId INT PRIMARY KEY,
            TenThousandYen INT DEFAULT(0),
            FiveThousandYen INT DEFAULT(0),
            OneThousandYen INT DEFAULT(0),
            FiveHundredYen INT DEFAULT(0),
            OneHundredYen INT DEFAULT(0),
            FiftyYen INT DEFAULT(0),
            TenYen INT DEFAULT(0),
            FiveYen INT DEFAULT(0),
            OneYen INT DEFAULT(0),
            FOREIGN KEY (TransactionId) REFERENCES Transactions(Id) ON DELETE CASCADE
          )
        `);

        for (let i = 0; i < transactions.length; i++) {
          const t = transactions[i];
          const d = denominations[i];

          const request = transaction.request();
          const transactionResult = await request
            .input(
              "TransactionDate",
              sql.DateTime2(3),
              t.TransactionDate || null
            )
            .input("TransactionType", sql.NVarChar, t.TransactionType)
            .input("Amount", sql.Int, t.Amount)
            .input("Summary", sql.NVarChar, t.Summary)
            .input("Recipient", sql.NVarChar, t.Recipient)
            .input("Memo", sql.NVarChar, t.Memo).query(`
              INSERT INTO Transactions (TransactionDate, TransactionType, Amount, Summary, Recipient, Memo)
              OUTPUT INSERTED.Id
              VALUES (@TransactionDate, @TransactionType, @Amount, @Summary, @Recipient, @Memo)
            `);

          const insertedId = transactionResult.recordset[0].Id;

          await transaction
            .request()
            .input("TransactionId", sql.Int, insertedId)
            .input("TenThousandYen", sql.Int, d.TenThousandYen)
            .input("FiveThousandYen", sql.Int, d.FiveThousandYen)
            .input("OneThousandYen", sql.Int, d.OneThousandYen)
            .input("FiveHundredYen", sql.Int, d.FiveHundredYen)
            .input("OneHundredYen", sql.Int, d.OneHundredYen)
            .input("FiftyYen", sql.Int, d.FiftyYen)
            .input("TenYen", sql.Int, d.TenYen)
            .input("FiveYen", sql.Int, d.FiveYen)
            .input("OneYen", sql.Int, d.OneYen).query(`
              INSERT INTO Denomination (TransactionId, TenThousandYen, FiveThousandYen, OneThousandYen, FiveHundredYen, OneHundredYen, FiftyYen, TenYen, FiveYen, OneYen)
              VALUES (@TransactionId, @TenThousandYen, @FiveThousandYen, @OneThousandYen, @FiveHundredYen, @OneHundredYen, @FiftyYen, @TenYen, @FiveYen, @OneYen)
            `);
        }

        await transaction.commit();
        res
          .status(200)
          .send("CSVデータが正常にインポートされました（テーブル再作成）");
      } catch (err) {
        await transaction.rollback();
        console.error("❌ データベース挿入エラー:", err);
        res.status(500).send("インポートに失敗しました");
      } finally {
        fs.unlinkSync(filePath);
      }
    })
    .on("error", (err) => {
      console.error("❌ CSVファイルの読み込みエラー:", err);
      res.status(500).send("CSVファイルの読み込みに失敗しました");
    });
};
module.exports = {
  getTransactionHistory,
  insertTransaction,
  getCurrentInventory,
  calculateCarryover,
  updateTransactionBasic,
  deleteTransaction,
  updateTransactionWithDenomination,
  exportDenominations,
  importCsv,
};
