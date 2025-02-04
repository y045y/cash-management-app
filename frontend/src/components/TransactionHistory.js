import React, { useEffect, useState } from "react";
import axios from "axios";
import PDFButton from "./PDFButton";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    fetchTransactions();
  }, [currentMonth]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transaction-history?startDate=${currentMonth}-01`);
      console.log("📌 取得したデータ:", response.data);
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("❌ 取引履歴取得エラー:", error);
    }
  };

  return (
    <div style={{ textAlign: "center" }}> {/* ✅ 全体を中央寄せ */}

      {/* 🔄 月切り替えボタン + PDFダウンロードを右寄せ */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
        <button
          className="btn btn-outline-primary"
          onClick={() => setCurrentMonth(prev => new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() - 1)).toISOString().slice(0, 7))}
        >
          前月
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => setCurrentMonth(new Date().toISOString().slice(0, 7))}
        >
          当月
        </button>
        <button
          className="btn btn-outline-primary"
          onClick={() => setCurrentMonth(prev => new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() + 1)).toISOString().slice(0, 7))}
        >
          次月
        </button>
        <PDFButton transactions={transactions} currentMonth={currentMonth} />
      </div>

      {/* ✅ 取引履歴テーブル */}
      <table className="table table-bordered text-center" style={{ fontSize: "12px", margin: "10px auto", maxWidth: "900px" }}>
        <thead className="table-dark">
          <tr>
            <th>日付</th>
            <th>入金</th>
            <th>出金</th>
            <th>残高</th>
            <th>相手</th>
            <th>摘要</th>
            <th>メモ</th>
            <th>万</th>
            <th>5千</th>
            <th>千</th>
            <th>5百</th>
            <th>百</th>
            <th>5十</th>
            <th>十</th>
            <th>5</th>
            <th>1</th>
          </tr>
        </thead>
        <tbody>
          {/* ✅ 繰越データを最初の行に表示 */}
          {transactions.length > 0 && (
            <tr>
              <td>繰</td>
              <td></td>
              <td></td>
              <td className="text-end">{transactions[0].RunningBalance.toLocaleString()}</td>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-end">{transactions[0].TenThousandYen || 0}</td>
              <td className="text-end">{transactions[0].FiveThousandYen || 0}</td>
              <td className="text-end">{transactions[0].OneThousandYen || 0}</td>
              <td className="text-end">{transactions[0].FiveHundredYen || 0}</td>
              <td className="text-end">{transactions[0].OneHundredYen || 0}</td>
              <td className="text-end">{transactions[0].FiftyYen || 0}</td>
              <td className="text-end">{transactions[0].TenYen || 0}</td>
              <td className="text-end">{transactions[0].FiveYen || 0}</td>
              <td className="text-end">{transactions[0].OneYen || 0}</td>
            </tr>
          )}

          {/* ✅ 取引データの表示 */}
          {transactions.length > 0 ? (
            transactions.slice(1).map((tx, index) => (
              <tr key={index}>
                {/* 📌 日付フォーマットを "2/5" 形式に変更 */}
                <td>{tx.TransactionDate ? new Date(tx.TransactionDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) : "現"}</td>

                <td className="text-end">{tx.TransactionType === "入金" ? tx.Amount.toLocaleString() : ""}</td>
                <td className="text-end">{tx.TransactionType === "出金" ? tx.Amount.toLocaleString() : ""}</td>
                <td className="text-end">{tx.RunningBalance !== null ? tx.RunningBalance.toLocaleString() : "N/A"}</td>
                <td className="text-start">{tx.Recipient || ""}</td>
                <td className="text-start">{tx.Summary || ""}</td>
                <td className="text-start">{tx.Memo || ""}</td>
                <td className="text-end">{tx.TenThousandYen || 0}</td>
                <td className="text-end">{tx.FiveThousandYen || 0}</td>
                <td className="text-end">{tx.OneThousandYen || 0}</td>
                <td className="text-end">{tx.FiveHundredYen || 0}</td>
                <td className="text-end">{tx.OneHundredYen || 0}</td>
                <td className="text-end">{tx.FiftyYen || 0}</td>
                <td className="text-end">{tx.TenYen || 0}</td>
                <td className="text-end">{tx.FiveYen || 0}</td>
                <td className="text-end">{tx.OneYen || 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="16" className="text-center">取引データなし</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
