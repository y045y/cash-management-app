import React, { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL;

const CashStateTable = () => {
  const [cashState, setCashState] = useState({});
  const [inputCounts, setInputCounts] = useState({});
  const [difference, setDifference] = useState(0);
  const [error, setError] = useState(null);

  const denominationLabels = {
    TotalTenThousandYen: "万",
    TotalFiveThousandYen: "5千",
    TotalOneThousandYen: "千",
    TotalFiveHundredYen: "5百",
    TotalOneHundredYen: "百",
    TotalFiftyYen: "5十",
    TotalTenYen: "十",
    TotalFiveYen: "5",
    TotalOneYen: "1",
  };

  const denominationValues = {
    TotalTenThousandYen: 10000,
    TotalFiveThousandYen: 5000,
    TotalOneThousandYen: 1000,
    TotalFiveHundredYen: 500,
    TotalOneHundredYen: 100,
    TotalFiftyYen: 50,
    TotalTenYen: 10,
    TotalFiveYen: 5,
    TotalOneYen: 1,
  };

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

  const handleInputChange = (denomination, e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) value = 0;
    setInputCounts(prev => ({
      ...prev,
      [denomination]: value,
    }));
  };

  const adjustCount = (denomination, delta) => {
    setInputCounts(prev => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + delta,
    }));
  };

  const calculateTotalAmount = () => {
    return Object.entries(cashState).reduce(
      (total, [denomination, count]) => total + denominationValues[denomination] * (count || 0),
      0
    );
  };

  const calculateDifference = () => {
    return Object.entries(inputCounts).reduce(
      (difference, [denomination, count]) => difference + denominationValues[denomination] * (count || 0),
      0
    );
  };

  useEffect(() => {
    const diff = calculateDifference();
    setDifference(isNaN(diff) ? 0 : diff);
  }, [inputCounts, cashState]);

  return (
    <div style={{ padding: "10px", maxWidth: "600px", margin: "0 auto" }}>
      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "#fff", marginBottom: "10px" }}>
        <thead>
          <tr style={{ backgroundColor: "#4CAF50", color: "#fff", fontWeight: "bold", fontSize: "14px", textAlign: "center", height: "25px" }}>
            <th style={{ padding: "5px", border: "1px solid #ddd" }}>金種</th>
            <th style={{ padding: "5px", border: "1px solid #ddd" }}>現在枚数</th>
            <th style={{ padding: "5px", border: "1px solid #ddd" }}>入力枚数</th>
          </tr>
        </thead>
        <tbody>
          {cashState && Object.entries(cashState).length > 0 ? (
            Object.entries(cashState).map(([denomination, count]) => (
              <tr key={denomination} style={{ borderBottom: "1px solid #ddd", height: "25px" }}>
                <td style={{ padding: "5px", textAlign: "center", fontSize: "14px" }}>{denominationLabels[denomination]}</td>
                <td style={{ padding: "5px", textAlign: "center", fontSize: "14px" }}>{count}</td>
                <td style={{ padding: "5px", textAlign: "center" }}>
                  <button
                    onClick={() => adjustCount(denomination, -1)}
                    style={{
                      width: "30px",
                      height: "30px",
                      fontSize: "14px",
                      marginRight: "5px",
                      backgroundColor: "#f44336",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={inputCounts[denomination] || ""}
                    onChange={(e) => handleInputChange(denomination, e)}
                    style={{
                      width: "60px",
                      height: "30px",
                      textAlign: "center",
                      fontSize: "14px",
                      margin: "0 5px",
                    }}
                  />
                  <button
                    onClick={() => adjustCount(denomination, 1)}
                    style={{
                      width: "30px",
                      height: "30px",
                      fontSize: "14px",
                      marginLeft: "5px",
                      backgroundColor: "#4CAF50",
                      color: "#fff",
                      border: "none",
                      borderRadius: "5px",
                    }}
                  >
                    +
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" style={{ textAlign: "center", padding: "10px" }}>データがありません</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "flex-end", padding: "5px 10px" }}>
        <div>
          <h4 style={{ fontSize: "14px", marginBottom: "2px" }}>合計金額</h4>
          <p style={{ fontSize: "14px" }}>¥{calculateTotalAmount().toLocaleString()}</p>
        </div>
        <div style={{ marginLeft: "20px" }}>
          <h4 style={{ fontSize: "14px", marginBottom: "2px" }}>差額</h4>
          <p style={{ fontSize: "14px" }}>¥{difference.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default CashStateTable;
