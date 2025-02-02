import React, { useEffect, useState } from "react";
import axios from "axios";
import PDFButton from "./PDFButton";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
  const [previousCarryOver, setPreviousCarryOver] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [currentMonth]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transaction-history?startDate=${currentMonth}-01`);
      console.log("📌 取得したデータ:", response.data); // ✅ ここでデータ確認
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("❌ 取引履歴取得エラー:", error);
    }
  };


  return (
    <div>
      <h2>取引履歴</h2>
      <p>現在の月: {currentMonth}</p>

      {/* 🔄 月切り替えボタン + PDF ダウンロード */}
      <div className="mb-3 d-flex">
        <button className="btn btn-outline-primary me-2" onClick={() => setCurrentMonth(prev => new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() - 1)).toISOString().slice(0, 7))}>前月</button>
        <button className="btn btn-outline-secondary me-2" onClick={() => setCurrentMonth(new Date().toISOString().slice(0, 7))}>当月</button>
        <button className="btn btn-outline-primary ms-2" onClick={() => setCurrentMonth(prev => new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() + 1)).toISOString().slice(0, 7))}>次月</button>
      </div>

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>日付</th>
            <th>取引種別</th>
            <th>金額</th>
            <th>摘要</th>
            <th>メモ</th>
            <th>相手</th>
            <th>残高</th>
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
          {transactions.length > 0 ? (
            transactions.map((tx, index) => (
              <tr key={index}>
                <td>{tx.TransactionDate ? tx.TransactionDate.split("T")[0] : "N/A"}</td>
                <td>{tx.TransactionType || "N/A"}</td>
                <td>{tx.Amount !== null ? tx.Amount.toLocaleString() : "N/A"}</td>
                <td>{tx.Summary || "N/A"}</td>
                <td>{tx.Memo || "N/A"}</td>
                <td>{tx.Recipient || "N/A"}</td>
                <td>{tx.RunningBalance !== null ? tx.RunningBalance.toLocaleString() : "N/A"}</td>
                <td>{tx.TenThousandYen ?? 0}</td>
                <td>{tx.FiveThousandYen ?? 0}</td>
                <td>{tx.OneThousandYen ?? 0}</td>
                <td>{tx.FiveHundredYen ?? 0}</td>
                <td>{tx.OneHundredYen ?? 0}</td>
                <td>{tx.FiftyYen ?? 0}</td>
                <td>{tx.TenYen ?? 0}</td>
                <td>{tx.FiveYen ?? 0}</td>
                <td>{tx.OneYen ?? 0}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="16" className="text-center">取引データなし</td>
            </tr>
          )}
        </tbody>
      </table>
            {/* ✅ PDFダウンロードボタンを追加 */}
            <PDFButton transactions={transactions} currentMonth={currentMonth} />
    </div>
  );
};

export default TransactionHistory;
