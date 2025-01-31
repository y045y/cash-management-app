import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";

// モーダルの設定
Modal.setAppElement("#root");

const TransactionHistory = () => {
  const [history, setHistory] = useState([]); // 取引履歴データ
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [carryOver, setCarryOver] = useState(null); // 繰越データ
  const [editingItem, setEditingItem] = useState(null); // 編集中の取引データ
  const [finalDenominations, setFinalDenominations] = useState({}); // 月末の金種データ

  useEffect(() => {
    fetchHistory(currentMonth);
    fetchCarryOver(currentMonth);
  }, [currentMonth]);

  // 取引履歴を取得
  const fetchHistory = async (month) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/history?month=${month}`);
      setHistory(response.data);
    } catch (error) {
      console.error("❌ データ取得エラー:", error);
    }
  };

  // 前月の繰越データを取得
  const fetchCarryOver = async (month) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/history/last?month=${month}`);
      if (response.data && Object.keys(response.data).length > 0) {
        setCarryOver(response.data);
      } else {
        console.warn("⚠️ 繰越データなし（デフォルトを設定）");
        setCarryOver({
          TotalBalance: 0,
          TenThousandYen: 0,
          FiveThousandYen: 0,
          OneThousandYen: 0,
          FiveHundredYen: 0,
          OneHundredYen: 0,
          FiftyYen: 0,
          TenYen: 0,
          FiveYen: 0,
          OneYen: 0,
        });
      }
    } catch (error) {
      console.error("❌ 繰越データ取得エラー:", error);
      setCarryOver({
        TotalBalance: 0,
        TenThousandYen: 0,
        FiveThousandYen: 0,
        OneThousandYen: 0,
        FiveHundredYen: 0,
        OneHundredYen: 0,
        FiftyYen: 0,
        TenYen: 0,
        FiveYen: 0,
        OneYen: 0,
      });
    }
  };

  // 月を変更
  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth + "-01");
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  };

  // 金種の最終状態を計算
  useEffect(() => {
    if (carryOver && history.length > 0) {
      let finalDenom = { ...carryOver };

      history.forEach((item) => {
        if (item.TransactionType === "入金") {
          finalDenom.TenThousandYen += item.TenThousandYen || 0;
          finalDenom.FiveThousandYen += item.FiveThousandYen || 0;
          finalDenom.OneThousandYen += item.OneThousandYen || 0;
          finalDenom.FiveHundredYen += item.FiveHundredYen || 0;
          finalDenom.OneHundredYen += item.OneHundredYen || 0;
          finalDenom.FiftyYen += item.FiftyYen || 0;
          finalDenom.TenYen += item.TenYen || 0;
          finalDenom.FiveYen += item.FiveYen || 0;
          finalDenom.OneYen += item.OneYen || 0;
        } else if (item.TransactionType === "出金") {
          finalDenom.TenThousandYen -= item.TenThousandYen || 0;
          finalDenom.FiveThousandYen -= item.FiveThousandYen || 0;
          finalDenom.OneThousandYen -= item.OneThousandYen || 0;
          finalDenom.FiveHundredYen -= item.FiveHundredYen || 0;
          finalDenom.OneHundredYen -= item.OneHundredYen || 0;
          finalDenom.FiftyYen -= item.FiftyYen || 0;
          finalDenom.TenYen -= item.TenYen || 0;
          finalDenom.FiveYen -= item.FiveYen || 0;
          finalDenom.OneYen -= item.OneYen || 0;
        }
      });

      setFinalDenominations(finalDenom);
    }
  }, [carryOver, history]);

  return (
    <div className="container mt-4">
      <h2 className="mb-3">取引履歴</h2>

      {/* 月切り替えボタン */}
      <div className="mb-3">
        <button className="btn btn-outline-primary me-2" onClick={() => changeMonth(-1)}>前月</button>
        <span className="fw-bold">{currentMonth}</span>
        <button className="btn btn-outline-primary ms-2" onClick={() => changeMonth(1)}>次月</button>
      </div>

      <table className="table table-bordered">
        <thead className="table-dark">
          <tr>
            <th>日付</th>
            <th>入金</th>
            <th>出金</th>
            <th>その他</th>
            <th>摘要</th>
            <th>相手</th>
            <th>メモ</th>
            <th>金額</th>
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
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {/* 繰越金額の行 */}
          {carryOver !== null && (
            <tr className="table-warning">
              <td>繰越</td>
              <td colSpan="7"></td>
              <td className="fw-bold">{carryOver.TotalBalance.toLocaleString()}</td>
              <td>{carryOver.TenThousandYen}</td>
              <td>{carryOver.FiveThousandYen}</td>
              <td>{carryOver.OneThousandYen}</td>
              <td>{carryOver.FiveHundredYen}</td>
              <td>{carryOver.OneHundredYen}</td>
              <td>{carryOver.FiftyYen}</td>
              <td>{carryOver.TenYen}</td>
              <td>{carryOver.FiveYen}</td>
              <td>{carryOver.OneYen}</td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
