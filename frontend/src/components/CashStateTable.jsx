import React from "react";

const CashStateTable = ({ cashState = {}, inputCounts = {}, handleInputChange }) => {
  const denominationLabels = {
    "1": "万",
    "2": "5千",
    "3": "千",
    "4": "5百",
    "5": "百",
    "6": "5十",
    "7": "十",
    "8": "5",
    "9": "1",
  };

  // 増減ボタン用の関数
  const adjustCount = (denomination, delta) => {
    const currentValue = parseInt(inputCounts[denomination] || 0, 10);
    const newValue = currentValue + delta;
    handleInputChange(denomination, newValue);
  };

  return (
    <div
      style={{
        margin: "20px auto",
        maxWidth: "800px",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      <table
        className="cash-state-table"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          backgroundColor: "#fff",
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontWeight: "bold",
              fontSize: "18px",
              textAlign: "center",
            }}
          >
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>金種</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>現在枚数</th>
            <th style={{ padding: "10px", border: "1px solid #ddd", textAlign: "center" }}>入力枚数</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(cashState).map(([denomination, count]) => (
            <tr
              key={denomination}
              style={{
                borderBottom: "1px solid #ddd",
                transition: "background-color 0.2s ease",
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9f9f9")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <td
                style={{
                  padding: "10px",
                  fontSize: "20px",
                  fontWeight: "bold",
                  textAlign: "center",
                  border: "1px solid #ddd",
                }}
              >
                {denominationLabels[denomination] || `${denomination}円`}
              </td>
              <td
                style={{
                  padding: "10px",
                  fontSize: "20px",
                  textAlign: "center",
                  fontWeight: "bold",
                  border: "1px solid #ddd",
                }}
              >
                {count || 0}
              </td>
              <td
                style={{
                  padding: "10px",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #ddd",
                  gap: "10px",
                }}
              >
                {/* 左側の「-」ボタン */}
                <button
                  className="btn btn-danger"
                  style={{
                    width: "40px",
                    height: "30px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "5px",
                    border: "none",
                  }}
                  onClick={() => adjustCount(denomination, -1)}
                >
                  -
                </button>
                {/* 中央の入力フィールド */}
                <input
                  type="number"
                  value={inputCounts[denomination] || ""}
                  onChange={(e) =>
                    handleInputChange(denomination, parseInt(e.target.value, 10) || 0)
                  }
                  style={{
                    width: "60px",
                    height: "30px",
                    textAlign: "center",
                    padding: "5px",
                    fontSize: "20px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                  placeholder="0"
                />
                {/* 右側の「+」ボタン */}
                <button
                  className="btn btn-success"
                  style={{
                    width: "40px",
                    height: "30px",
                    fontSize: "20px",
                    fontWeight: "bold",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: "5px",
                    border: "none",
                  }}
                  onClick={() => adjustCount(denomination, 1)}
                >
                  +
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CashStateTable;
