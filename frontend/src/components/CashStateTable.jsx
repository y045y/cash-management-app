// frontend/src/components/CashStateTable.jsx
import React, { useEffect, useCallback } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/cashStateTable.css";

// 金種の単価
const denominationValues = {
  TenThousandYen: 10000,
  FiveThousandYen: 5000,
  OneThousandYen: 1000,
  FiveHundredYen: 500,
  OneHundredYen: 100,
  FiftyYen: 50,
  TenYen: 10,
  FiveYen: 5,
  OneYen: 1,
};

// 金種のラベル
const denominationLabels = {
  TenThousandYen: "万",
  FiveThousandYen: "5千",
  OneThousandYen: "千",
  FiveHundredYen: "5百",
  OneHundredYen: "百",
  FiftyYen: "5十",
  TenYen: "十",
  FiveYen: "5",
  OneYen: "1",
};

const CashStateTable = ({
  inputCounts,
  setInputCounts,
  setDifference,
  cashState = {},
}) => {
  // 現在の金額（在庫）
  const calculateTotalAmount = () => {
    return Object.entries(denominationValues).reduce(
      (total, [denomination, value]) =>
        total + (cashState[denomination] || 0) * value,
      0
    );
  };

  // 入力金額合計
  const calculateInputAmount = useCallback(() => {
    return Object.entries(inputCounts).reduce(
      (sum, [denomination, count]) =>
        sum + (denominationValues[denomination] || 0) * (count || 0),
      0
    );
  }, [inputCounts]);

  // 差額（＝今回の出金/入金金額）を親に渡す
  useEffect(() => {
    setDifference(calculateInputAmount());
  }, [calculateInputAmount, setDifference]);

  // 金種の増減
  const adjustCount = (denomination, delta) => {
    setInputCounts((prev) => ({
      ...prev,
      [denomination]: (prev[denomination] || 0) + delta,
    }));
  };

  return (
    <div className="container mt-3">
      <table className="fs-5 table table-bordered table-hover table-striped table-sm text-center cash-state-table">
        <thead className="table-success">
          <tr>
            <th>金種</th>
            <th>現在枚数</th>
            <th>入力枚数</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(denominationLabels).map(
            ([denomination, label]) => (
              <tr key={denomination}>
                <td className="fs-4">{label}</td>
                <td className="fs-4">
                  {cashState[denomination] !== undefined
                    ? cashState[denomination]
                    : 0}
                </td>
                <td className="d-flex align-items-center justify-content-center gap-2">
                  <div className="btn-group">
                    <button
                      className="fs-6 btn btn-sm btn-outline-danger"
                      onClick={() => adjustCount(denomination, -1)}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={inputCounts[denomination] || ""}
                      className="fs-4 fw-bold form-control form-control-sm w-50 text-center"
                      onChange={(e) =>
                        setInputCounts((prev) => ({
                          ...prev,
                          [denomination]:
                            parseInt(e.target.value, 10) || 0,
                        }))
                      }
                    />
                    <button
                      className="fs-6 btn btn-sm btn-outline-primary"
                      onClick={() => adjustCount(denomination, 1)}
                    >
                      +
                    </button>
                  </div>
                </td>
              </tr>
            )
          )}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="2" className="fs-4 text-end fw-bold">
              現金:
            </td>
            <td className="fs-4 fw-bold">
              ¥{calculateTotalAmount().toLocaleString()}
            </td>
          </tr>
          <tr>
            <td colSpan="2" className="fs-4 text-end fw-bold">
              差額:
            </td>
            <td className="fs-4 fw-bold text-danger">
              ¥{calculateInputAmount().toLocaleString()}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default CashStateTable;
