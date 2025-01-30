import React, { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal"; // ✅ モーダルを使用

Modal.setAppElement("#root");

const TransactionHistory = () => {
  const [history, setHistory] = useState([]);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/history");
      setHistory(response.data);
    } catch (error) {
      console.error("❌ データ取得エラー:", error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingItem({ ...transaction });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleChange = (e) => {
    setEditingItem({ ...editingItem, [e.target.name]: e.target.value });
  };

  const handleDenominationChange = (e, key) => {
    setEditingItem({
      ...editingItem,
      [key]: parseInt(e.target.value, 10) || 0,
    });
  };

  const handleUpdate = async () => {
    try {
      const denominationJson = {
        "10000": editingItem.TenThousandYen || 0,
        "5000": editingItem.FiveThousandYen || 0,
        "1000": editingItem.OneThousandYen || 0,
        "500": editingItem.FiveHundredYen || 0,
        "100": editingItem.OneHundredYen || 0,
        "50": editingItem.FiftyYen || 0,
        "10": editingItem.TenYen || 0,
        "5": editingItem.FiveYen || 0,
        "1": editingItem.OneYen || 0,
      };

      const updatedData = {
        ...editingItem,
        DenominationJson: JSON.stringify(denominationJson),
      };

      await axios.put(`http://localhost:5000/api/transactions/${editingItem.Id}`, updatedData);
      alert("✅ 取引を修正しました！");
      setEditingItem(null);
      fetchHistory();
    } catch (error) {
      console.error("❌ 更新エラー:", error);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-3">取引履歴</h2>
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
            {/* ✅ 金種の列を追加 */}
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
          {history.map((item) => (
            <tr key={item.Id}>
              <td>{new Date(item.TransactionDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })}</td>
              <td className="text-end">{item.TransactionType === "入金" ? item.Amount.toLocaleString() : "-"}</td>
              <td className="text-end">{item.TransactionType === "出金" ? item.Amount.toLocaleString() : "-"}</td>
              <td className="text-center">{item.TransactionType === "その他" ? "✔" : "-"}</td>
              <td>{item.Summary}</td>
              <td>{item.Recipient || "-"}</td>
              <td>{item.Memo}</td>
              <td className="text-end">{item.Amount.toLocaleString()}</td>
              <td className="text-end fw-bold">{item.TotalBalance.toLocaleString()}</td>
              {/* ✅ 修正前の金種表示 */}
              <td className="text-end">{item.TenThousandYen}</td>
              <td className="text-end">{item.FiveThousandYen}</td>
              <td className="text-end">{item.OneThousandYen}</td>
              <td className="text-end">{item.FiveHundredYen}</td>
              <td className="text-end">{item.OneHundredYen}</td>
              <td className="text-end">{item.FiftyYen}</td>
              <td className="text-end">{item.TenYen}</td>
              <td className="text-end">{item.FiveYen}</td>
              <td className="text-end">{item.OneYen}</td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(item)}>修正</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ モーダル */}
      {editingItem && (
        <Modal isOpen={!!editingItem} onRequestClose={handleCancelEdit} className="modal-dialog">
          <div className="modal-content p-4">
            <h4>取引修正</h4>

            <label>日付</label>
            <input type="date" name="TransactionDate" value={editingItem.TransactionDate.split("T")[0]} onChange={handleChange} className="form-control mb-2" />

            <label>種別</label>
            <select name="TransactionType" value={editingItem.TransactionType} onChange={handleChange} className="form-control mb-2">
              <option value="入金">入金</option>
              <option value="出金">出金</option>
              <option value="その他">その他</option>
            </select>

            <label>金額</label>
            <input type="number" name="Amount" value={editingItem.Amount} onChange={handleChange} className="form-control mb-2" />

            {/* ✅ 金種の編集 */}
            <label>金種</label>
            <div className="row">
              {["TenThousandYen", "FiveThousandYen", "OneThousandYen", "FiveHundredYen", "OneHundredYen", "FiftyYen", "TenYen", "FiveYen", "OneYen"].map((key, index) => (
                <div className="col-4 mb-2" key={index}>
                  <label>{key.replace("Yen", "")}円</label>
                  <input type="number" value={editingItem[key] || 0} onChange={(e) => handleDenominationChange(e, key)} className="form-control" />
                </div>
              ))}
            </div>

            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-secondary me-2" onClick={handleCancelEdit}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleUpdate}>保存</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TransactionHistory;
