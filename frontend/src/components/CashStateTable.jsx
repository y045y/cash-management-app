import React, { useEffect, useState, useCallback } from "react"; // useCallbackをインポート
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const CashStateTable = () => {
  const [cashState, setCashState] = useState({});
  const [inputCounts, setInputCounts] = useState({});
  const [difference, setDifference] = useState(0);
  const [error, setError] = useState(null);

  // 金種のラベル
  const denominationLabels = {
    "TotalTenThousandYen": "万",
    "TotalFiveThousandYen": "5千",
    "TotalOneThousandYen": "千",
    "TotalFiveHundredYen": "5百",
    "TotalOneHundredYen": "百",
    "TotalFiftyYen": "5十",
    "TotalTenYen": "十",
    "TotalFiveYen": "5",
    "TotalOneYen": "1",
  };

  // 金種の価値 (金額計算用)
  const denominationValues = {
    "TotalTenThousandYen": 10000,
    "TotalFiveThousandYen": 5000,
    "TotalOneThousandYen": 1000,
    "TotalFiveHundredYen": 500,
    "TotalOneHundredYen": 100,
    "TotalFiftyYen": 50,
    "TotalTenYen": 10,
    "TotalFiveYen": 5,
    "TotalOneYen": 1,
  };

   // APIから金庫の状態を取得
   useEffect(() => {
    const fetchCashState = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/current-inventory`);
        setCashState(response.data);
        setInputCounts(Object.fromEntries(Object.keys(response.data).map(key => [key, 0])));
        setError(null);
      } catch (error) {
        console.error("金庫状態取得エラー:", error);
        setError("金庫状態の取得に失敗しました。");
      }
    };
    fetchCashState();
  }, []);

  // 金種の入力値変更
  const handleInputChange = (denomination, e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    setInputCounts(prev => ({
      ...prev,
      [denomination]: value,
    }));
  };

  // 金種の増減
  const adjustCount = (denomination, delta) => {
    setInputCounts(prev => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + delta,
    }));
  };

  // 合計金額を計算
  const calculateTotalAmount = () => {
    let total = 0;
    Object.entries(cashState).forEach(([denomination, count]) => {
      total += denominationValues[denomination] * (count || 0);
    });
    return total;
  };

  // 差額を計算
  const calculateDifference = () => {
    let difference = 0;
    Object.entries(inputCounts).forEach(([denomination, count]) => {
      difference += denominationValues[denomination] * (count || 0);
    });
    return difference;
  };

  // 合計金額と差額を更新
  useEffect(() => {
    const total = calculateTotalAmount();
    const diff = calculateDifference();

    setDifference(isNaN(diff) ? 0 : diff);
  }, [inputCounts, cashState]);  // 合計金額と差額はこの2つに依存

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}
      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", marginBottom: "20px" }}>
        <thead>
          <tr style={{ backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", fontSize: "24px", textAlign: "center" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>金種</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>現在枚数</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>入力枚数</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cashState).map(([denomination, count]) => (
            <tr key={denomination} style={{ borderBottom: "1px solid #ddd" }}>
              <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", fontSize: "24px" }}>
                {denominationLabels[denomination]}
              </td>
              <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", fontSize: "24px" }}>
                {count}
              </td>
              <td style={{ padding: "10px", textAlign: "center" }}>
                <button
                  onClick={() => adjustCount(denomination, -1)}
                  style={{
                    width: "40px", height: "40px", fontSize: "20px", marginRight: "10px",
                    backgroundColor: "#f44336", color: "#fff", border: "none", borderRadius: "5px"
                  }}
                >
                  - 
                </button>
                <input
                  type="number"
                  value={inputCounts[denomination] || ""}
                  onChange={(e) => handleInputChange(denomination, e)}
                  style={{
                    width: "80px", height: "40px", textAlign: "center", fontSize: "24px", margin: "0 10px"
                  }}
                />
                <button
                  onClick={() => adjustCount(denomination, 1)}
                  style={{
                    width: "40px", height: "40px", fontSize: "20px", marginLeft: "10px",
                    backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "5px"
                  }}
                >
                  +
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 合計金額表示をテーブル外に移動 */}
      <div style={{ textAlign: "right", display: "flex", justifyContent: "right", gap: "40px" }}>
        <div>
          <h3 style={{ fontWeight: "bold", fontSize: "24px" }}>合計金額</h3>
          <p style={{ fontSize: "24px" }}>
            ¥{calculateTotalAmount().toLocaleString()}
          </p>
        </div>

        <div>
          <h3 style={{ fontWeight: "bold", fontSize: "24px" }}>差額</h3>
          <p style={{ fontSize: "24px" }}>
            ¥{difference.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CashStateTable;