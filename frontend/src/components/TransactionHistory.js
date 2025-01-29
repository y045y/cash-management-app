import React from "react";
import PDFButton from './PDFButton';

const TransactionHistory = ({
  history = [],
  currentYear,
  currentMonth,
  handlePreviousMonth,
  handleNextMonth,
  deleteHistory,
  loading,
  previousCarryOver,
}) => {
  // 履歴を日付順にソート
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.TransactionDate) - new Date(b.TransactionDate)
  );

  // 日付フォーマット関数
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1; // 月は0ベース
    const day = date.getDate();
    return `${month}/${day}`;
  };

  return (
    <div className="table-responsive">
      {/* 年月切り替えと印刷ボタン */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-primary"
          onClick={handlePreviousMonth}
          disabled={loading}
        >
          前月
        </button>
        <h5>{`${currentYear || ""}年 ${currentMonth || ""}月`}</h5>
        <div>
          <button
            className="btn btn-outline-primary me-2"
            onClick={handleNextMonth}
            disabled={loading}
          >
            次月
          </button>
          <PDFButton
            history={history || []}
            currentMonth={currentMonth || 0}
            previousCarryOver={previousCarryOver || {}}
          />
        </div>
      </div>

      {/* 履歴テーブル */}
      <table className="table table-bordered table-hover">
        <thead className="table-secondary text-center">
          <tr>
            <th>日付</th>
            <th>処理</th>
            <th>金額</th>
            <th>摘要</th>
            <th>相手</th>
            <th>メモ</th>
            <th>合計金額</th>
            <th>差額</th>
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
          {/* 前月繰越 */}
          {previousCarryOver && (
            <tr className="transaction-history-header">
              <td className="text-left">繰越</td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td></td>
              <td className="text-right">
                {previousCarryOver.TotalAmount?.toLocaleString() || 0}
              </td>
              <td></td>
              <td className="text-right">{previousCarryOver.TenThousandYen || 0}</td>
              <td className="text-right">{previousCarryOver.FiveThousandYen || 0}</td>
              <td className="text-right">{previousCarryOver.OneThousandYen || 0}</td>
              <td className="text-right">{previousCarryOver.FiveHundredYen || 0}</td>
              <td className="text-right">{previousCarryOver.OneHundredYen || 0}</td>
              <td className="text-right">{previousCarryOver.FiftyYen || 0}</td>
              <td className="text-right">{previousCarryOver.TenYen || 0}</td>
              <td className="text-right">{previousCarryOver.FiveYen || 0}</td>
              <td className="text-right">{previousCarryOver.OneYen || 0}</td>
              <td></td>
            </tr>
          )}

          {/* 履歴がない場合のメッセージ */}
          {sortedHistory.length === 0 && !previousCarryOver && (
            <tr>
              <td colSpan="18" className="text-center">
                データがありません
              </td>
            </tr>
          )}

          {/* 履歴データを表示 */}
          {sortedHistory.map((item) => (
            <tr key={item.TransactionID}>
              <td className="text-left">{formatDate(item.TransactionDate)}</td>
              <td className="text-left">{item.TransactionType}</td>
              <td className="text-right">{item.Amount?.toLocaleString()}</td>
              <td className="text-left">{item.Description}</td>
              <td className="text-left">{item.Recipient}</td>
              <td className="text-left">{item.Memo}</td>
              <td className="text-right">{item.TotalAmount?.toLocaleString()}</td>
              <td className="text-right">{item.TotalBalance?.toLocaleString()}</td>
              <td className="text-right">{item.TenThousandYen || 0}</td>
              <td className="text-right">{item.FiveThousandYen || 0}</td>
              <td className="text-right">{item.OneThousandYen || 0}</td>
              <td className="text-right">{item.FiveHundredYen || 0}</td>
              <td className="text-right">{item.OneHundredYen || 0}</td>
              <td className="text-right">{item.FiftyYen || 0}</td>
              <td className="text-right">{item.TenYen || 0}</td>
              <td className="text-right">{item.FiveYen || 0}</td>
              <td className="text-right">{item.OneYen || 0}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteHistory(item.TransactionID)}
                >
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
