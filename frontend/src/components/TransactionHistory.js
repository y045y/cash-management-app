import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PDFButton from "./PDFButton";
import "bootstrap/dist/css/bootstrap.min.css";

// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API_URL =
  "https://cashmanagement-app-ahhjctexgrbbgce2.japaneast-01.azurewebsites.net";

const TransactionHistory = ({
  transactions,
  fetchTransactions,
  fetchCashState,
}) => {
  const [localTransactions, setLocalTransactions] = useState([]);
  const [editRow, setEditRow] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [error, setError] = useState(null);

  // props.transactions の変更があれば即反映
  useEffect(() => {
    setLocalTransactions(transactions || []);
  }, [transactions]);

  const fetchTransactionsData = useCallback(
    async (retryCount = 3) => {
      try {
        const response = await axios.get(
          `${API_URL}/api/transaction-history?startDate=${currentMonth}-01`,
          { timeout: 10000 }
        );
        if (response.data && response.data.transactions) {
          // 🔽 ここは setLocalTransactions に変更
          setLocalTransactions(response.data.transactions);
        } else {
          setLocalTransactions([]);
          setError("データが取得できませんでした。");
        }
      } catch (error) {
        console.error("取引履歴取得エラー:", error);
        if (retryCount > 0) {
          setTimeout(() => fetchTransactionsData(retryCount - 1), 2000);
        } else {
          setError(
            "取引履歴の取得に失敗しました。サーバーを確認してください。"
          );
        }
      }
    },
    [currentMonth]
  );

  useEffect(() => {
    fetchTransactionsData();
  }, [fetchTransactionsData]);

  const handleDelete = async (transactionId) => {
    if (!transactionId) return;
    if (!window.confirm("この取引を削除しますか？")) return;

    try {
      await axios.delete(`${API_URL}/api/transactions/${transactionId}`);
      await fetchTransactionsData();
      if (fetchCashState) await fetchCashState();
    } catch (error) {
      console.error("削除エラー:", error);
    }
  };

  const handleImportClick = () => {
    document.getElementById("csvImportInput").click();
  };

  const importCSV = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_URL}/api/import-csv`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchTransactionsData();
      if (fetchCashState) await fetchCashState();
    } catch (error) {
      console.error("CSVインポートエラー:", error);
    } finally {
      event.target.value = "";
    }
  };

  const exportToDenominationsCSV = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/export-denominations`, {
        responseType: "blob",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([response.data]));
      link.download = "denominations.csv";
      link.click();
    } catch (error) {
      console.error("CSVダウンロードエラー:", error);
    }
  };

  const handleEditClick = (index) => {
    setEditRow(index);
  };

  const handleInputChange = (index, field, value) => {
    const updatedTransactions = [...localTransactions];
    updatedTransactions[index][field] = value;
    setLocalTransactions(updatedTransactions);
  };

  const handleSaveClick = async (index) => {
    const transaction = transactions[index];
    try {
      await axios.put(
        `${API_URL}/api/update-transaction-and-denomination/${transaction.TransactionID}`,
        transaction
      );
      setEditRow(null);
      fetchTransactionsData();
      if (fetchCashState) fetchCashState();
    } catch (error) {
      console.error("更新エラー:", error);
    }
  };

  const handleCancelClick = () => {
    setEditRow(null);
    fetchTransactionsData();
  };

  return (
    <div className="container">
      {error && <p className="text-danger text-center">{error}</p>}

      <h4 className="text-center my-3">
        {new Date(`${currentMonth}-01`).getFullYear()}年
        {new Date(`${currentMonth}-01`).getMonth() + 1}月度
      </h4>

      <div className="d-flex justify-content-between align-items-center my-3">
        <div>
          <button className="btn btn-warning me-2" onClick={handleImportClick}>
            CSVIm
          </button>
          <button
            className="btn btn-info me-2"
            onClick={exportToDenominationsCSV}
          >
            CSVEx
          </button>
        </div>
        <div>
          <button
            className="btn btn-outline-primary me-2"
            onClick={() =>
              setCurrentMonth((prev) =>
                new Date(
                  new Date(prev + "-01").setMonth(
                    new Date(prev + "-01").getMonth() - 1
                  )
                )
                  .toISOString()
                  .slice(0, 7)
              )
            }
          >
            ◀ 前月
          </button>
          <button
            className="btn btn-outline-secondary me-2"
            onClick={() =>
              setCurrentMonth(new Date().toISOString().slice(0, 7))
            }
          >
            📅 当月
          </button>
          <button
            className="btn btn-outline-primary me-2"
            onClick={() =>
              setCurrentMonth((prev) =>
                new Date(
                  new Date(prev + "-01").setMonth(
                    new Date(prev + "-01").getMonth() + 1
                  )
                )
                  .toISOString()
                  .slice(0, 7)
              )
            }
          >
            次月 ▶
          </button>
        </div>
        <div>
          <PDFButton transactions={transactions} currentMonth={currentMonth} />
        </div>
        <input
          id="csvImportInput"
          type="file"
          accept=".csv"
          onChange={importCSV}
          style={{ display: "none" }}
        />
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered text-center align-middle">
          <thead className="table-dark">
            <tr>
              <th>日付</th>
              <th>金額</th>
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
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {localTransactions.length > 0 ? (
              localTransactions.map((tx, index) => (
                <tr key={index}>
                  {editRow === index ? (
                    <>
                      <td>
                        <input
                          type="date"
                          value={
                            tx.TransactionDate
                              ? tx.TransactionDate.split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "TransactionDate",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.Amount || ""}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "Amount",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        {tx.RunningBalance !== null
                          ? tx.RunningBalance.toLocaleString()
                          : "N/A"}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={tx.Recipient || ""}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "Recipient",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={tx.Summary || ""}
                          onChange={(e) =>
                            handleInputChange(index, "Summary", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={tx.Memo || ""}
                          onChange={(e) =>
                            handleInputChange(index, "Memo", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.TenThousandYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "TenThousandYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.FiveThousandYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "FiveThousandYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.OneThousandYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "OneThousandYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.FiveHundredYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "FiveHundredYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.OneHundredYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "OneHundredYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.FiftyYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "FiftyYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.TenYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "TenYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.FiveYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "FiveYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={tx.OneYen || 0}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "OneYen",
                              parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-1"
                          onClick={() => handleSaveClick(index)}
                        >
                          💾 保存
                        </button>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={handleCancelClick}
                        >
                          ❌ キャンセル
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        {tx.TransactionDate
                          ? new Date(tx.TransactionDate).toLocaleDateString(
                              "ja-JP",
                              { month: "numeric", day: "numeric" }
                            )
                          : "N/A"}
                      </td>
                      <td className="text-end">
                        {tx.Amount !== null
                          ? `${tx.Amount < 0 ? "-" : ""}${Math.abs(
                              tx.Amount
                            ).toLocaleString()}`
                          : "N/A"}
                      </td>
                      <td className="text-end">
                        {tx.RunningBalance !== null
                          ? `${tx.RunningBalance.toLocaleString()}`
                          : "N/A"}
                      </td>
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

                      <td>
                        <button
                          className="btn btn-sm btn-danger me-1"
                          onClick={() => handleDelete(tx.TransactionID)}
                        >
                          🗑 削除
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleEditClick(index)}
                        >
                          ✏️ 修正
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="16" className="text-center">
                  取引データなし
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistory;
