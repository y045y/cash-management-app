import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const CashStateTable = ({ cashState, setCashState, inputCounts, setInputCounts }) => {
  const [totalAmount, setTotalAmount] = useState(0);
  const [difference, setDifference] = useState(0);

  // 金種のラベル
  const denominationLabels = {
    "10000": "万",
    "5000": "5千",
    "1000": "千",
    "500": "5百",
    "100": "百",
    "50": "5十",
    "10": "十",
    "5": "5",
    "1": "1",
  };

  // 金種の価値 (金額計算用)
  const denominationValues = {
    "10000": 10000,
    "5000": 5000,
    "1000": 1000,
    "500": 500,
    "100": 100,
    "50": 50,
    "10": 10,
    "5": 5,
    "1": 1,
  };

  // 🔥 APIから金庫の状態を取得
  useEffect(() => {
    const fetchCashState = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/cashState`);
        setCashState(response.data.CurrentInventory || {});
        setInputCounts(Object.fromEntries(Object.keys(response.data.CurrentInventory || {}).map(key => [key, 0])));
      } catch (error) {
        console.error("金庫状態取得エラー:", error);
      }
    };
    fetchCashState();
  }, [setCashState, setInputCounts]);

  // 🔥 合計金額を計算
  useEffect(() => {
    let newTotalAmount = 0;
    Object.entries(cashState).forEach(([denomination, count]) => {
      const updatedCount = (count || 0) + (inputCounts[denomination] || 0);
      newTotalAmount += (updatedCount * denominationValues[denomination]);
    });
    setTotalAmount(newTotalAmount);
  }, [cashState, inputCounts]);

  // 🔥 差額を計算
  useEffect(() => {
    let newDifference = 0;
    Object.entries(inputCounts).forEach(([denomination, count]) => {
      newDifference += (count * denominationValues[denomination]);
    });
    setDifference(newDifference);
  }, [inputCounts]);

  // 🔥 金種の増減
  const adjustCount = (denomination, delta) => {
    setInputCounts(prev => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + delta
    }));
  };

  return (
    <div style={{ margin: "20px auto", maxWidth: "800px", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
      <table className="cash-state-table" style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff" }}>
        <thead>
          <tr style={{ backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", fontSize: "18px", textAlign: "center" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>金種</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>現在枚数</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>入力枚数</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cashState)
            .sort(([a], [b]) => b - a) // 🔥 金種を「万 → 1」の降順にソート
            .map(([denomination, count]) => {
              const updatedCount = (count || 0) + (inputCounts[denomination] || 0);
              return (
                <tr key={denomination} style={{ borderBottom: "1px solid #ddd", transition: "background-color 0.2s ease", backgroundColor: "transparent" }}>
                  <td style={{ padding: "10px", fontSize: "20px", fontWeight: "bold", textAlign: "center", border: "1px solid #ddd" }}>
                    {denominationLabels[denomination] || `${denomination}円`}
                  </td>
                  <td style={{ padding: "10px", fontSize: "20px", textAlign: "center", fontWeight: "bold", border: "1px solid #ddd" }}>
                    {updatedCount}
                  </td>
                  <td style={{ padding: "10px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #ddd", gap: "10px" }}>
                    <button className="btn btn-danger" style={{ width: "40px", height: "30px", fontSize: "20px", fontWeight: "bold", borderRadius: "5px", border: "none" }} onClick={() => adjustCount(denomination, -1)}>
                      -
                    </button>
                    <input
                      type="number"
                      value={inputCounts[denomination] || ""}
                      onChange={(e) => adjustCount(denomination, parseInt(e.target.value, 10) || 0)}
                      style={{ width: "60px", height: "30px", textAlign: "center", padding: "5px", fontSize: "20px", border: "1px solid #ccc", borderRadius: "4px", boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)" }}
                      placeholder="0"
                    />
                    <button className="btn btn-success" style={{ width: "40px", height: "30px", fontSize: "20px", fontWeight: "bold", borderRadius: "5px", border: "none" }} onClick={() => adjustCount(denomination, 1)}>
                      +
                    </button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {/* ✅ 合計金額と差額を表示 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", fontSize: "18px", fontWeight: "bold" }}>
        <span>合計金額: ¥{totalAmount.toLocaleString()}</span>
        <span>差額: ¥{difference.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default CashStateTable;
