// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import Modal from "react-modal";

// // モーダルの設定
// Modal.setAppElement("#root");

// const TransactionHistory = () => {
//   const [history, setHistory] = useState([]); // 今月の取引履歴データ
//   const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
//   const [carryOver, setCarryOver] = useState(null); // 繰越データ
//   const [finalDenominations, setFinalDenominations] = useState({});

//   const historyRef = useRef([]); // history を useRef で管理

//   // 初回レンダリング時と月変更時にデータ取得
//   useEffect(() => {
//     fetchCarryOver();
//     fetchHistory();
//   }, [currentMonth]);

//   // 繰越データを取得（前月の最終状態）
//   const fetchCarryOver = async () => {
//     try {
//       const response = await axios.get(`http://localhost:5000/api/lastmonth`);
//       console.log("✅ 繰越データ取得:", response.data); // デバッグ用

//       if (response.data && Object.keys(response.data).length > 0) {
//         setCarryOver({
//           TotalBalance: Number(response.data.TotalBalance) || 0,
//           TenThousandYen: Number(response.data.TenThousandYen) || 0,
//           FiveThousandYen: Number(response.data.FiveThousandYen) || 0,
//           OneThousandYen: Number(response.data.OneThousandYen) || 0,
//           FiveHundredYen: Number(response.data.FiveHundredYen) || 0,
//           OneHundredYen: Number(response.data.OneHundredYen) || 0,
//           FiftyYen: Number(response.data.FiftyYen) || 0,
//           TenYen: Number(response.data.TenYen) || 0,
//           FiveYen: Number(response.data.FiveYen) || 0,
//           OneYen: Number(response.data.OneYen) || 0,
//         });
//       } else {
//         console.warn("⚠️ 繰越データなし（デフォルト値を設定）");
//         resetCarryOver();
//       }
//     } catch (error) {
//       console.error("❌ 繰越データ取得エラー:", error);
//       resetCarryOver();
//     }
//   };

//   // 繰越データのデフォルト値を設定
//   const resetCarryOver = () => {
//     setCarryOver({
//       TotalBalance: 0,
//       TenThousandYen: 0,
//       FiveThousandYen: 0,
//       OneThousandYen: 0,
//       FiveHundredYen: 0,
//       OneHundredYen: 0,
//       FiftyYen: 0,
//       TenYen: 0,
//       FiveYen: 0,
//       OneYen: 0,
//     });
//   };

//   // 現在の月の履歴データを取得
//   const fetchHistory = async () => {
//     try {
//       const response = await axios.get(`http://localhost:5000/api/history?month=${currentMonth}`);
//       console.log(`📅 ${currentMonth} の履歴取得:`, response.data);
//       setHistory(response.data);
//     } catch (error) {
//       console.error("❌ データ取得エラー:", error);
//     }
//   };

//   // 月を変更
//   const changeMonth = (offset) => {
//     const newDate = new Date(currentMonth + "-01");
//     newDate.setMonth(newDate.getMonth() + offset);
//     setCurrentMonth(newDate.toISOString().slice(0, 7));
//   };

//   // 取引の削除
//   const handleDelete = async (id) => {
//     if (window.confirm("この取引を削除しますか？")) {
//       try {
//         await axios.delete(`http://localhost:5000/api/transactions/${id}`);
//         fetchHistory(); // 削除後にリロード
//       } catch (error) {
//         console.error("❌ 削除エラー:", error);
//       }
//     }
//   };

//   // 取引履歴の残高計算
//   useEffect(() => {
//     if (carryOver && history.length > 0) {
//       let adjustedHistory = [...history];

//       // 最初の取引に繰越データを適用
//       adjustedHistory[0].TotalBalance = (carryOver.TotalBalance || 0) + 
//       (adjustedHistory[0].TransactionType === "入金" ? adjustedHistory[0].Amount : -adjustedHistory[0].Amount);
    
//     // それ以降の取引は前の取引の残高を考慮して計算
//     for (let i = 1; i < adjustedHistory.length; i++) {
//       if (adjustedHistory[i].TransactionType === "入金") {
//         adjustedHistory[i].TotalBalance = adjustedHistory[i - 1].TotalBalance + adjustedHistory[i].Amount;
//       } else if (adjustedHistory[i].TransactionType === "出金") {
//         adjustedHistory[i].TotalBalance = adjustedHistory[i - 1].TotalBalance - adjustedHistory[i].Amount; // 出金は減算
//       }
//     }

//       historyRef.current = adjustedHistory;  // useRefを更新
//       setHistory(adjustedHistory);
//     }
//   }, [carryOver, currentMonth]); // `history.length` ではなく `carryOver` と `currentMonth` を依存配列に

//   // 金種の最終状態を計算
//   useEffect(() => {
//     if (carryOver && history.length > 0) {
//       let finalDenom = { ...carryOver };

//       history.forEach((item) => {
//         if (item.TransactionType === "入金") {
//           finalDenom.TenThousandYen += item.TenThousandYen || 0;
//           finalDenom.FiveThousandYen += item.FiveThousandYen || 0;
//           finalDenom.OneThousandYen += item.OneThousandYen || 0;
//           finalDenom.FiveHundredYen += item.FiveHundredYen || 0;
//           finalDenom.OneHundredYen += item.OneHundredYen || 0;
//           finalDenom.FiftyYen += item.FiftyYen || 0;
//           finalDenom.TenYen += item.TenYen || 0;
//           finalDenom.FiveYen += item.FiveYen || 0;
//           finalDenom.OneYen += item.OneYen || 0;
//         } else if (item.TransactionType === "出金") {
//           finalDenom.TenThousandYen -= item.TenThousandYen || 0;
//           finalDenom.FiveThousandYen -= item.FiveThousandYen || 0;
//           finalDenom.OneThousandYen -= item.OneThousandYen || 0;
//           finalDenom.FiveHundredYen -= item.FiveHundredYen || 0;
//           finalDenom.OneHundredYen -= item.OneHundredYen || 0;
//           finalDenom.FiftyYen -= item.FiftyYen || 0;
//           finalDenom.TenYen -= item.TenYen || 0;
//           finalDenom.FiveYen -= item.FiveYen || 0;
//           finalDenom.OneYen -= item.OneYen || 0;
//         }
//       });

//       setFinalDenominations(finalDenom);
//     }
//   }, [carryOver, history.length]); // history.length を監視して無限ループを防止

//   return (
//     <div>
//       <h2>取引履歴</h2>
//       <p>現在の月: {currentMonth}</p>

//       {/* 月切り替えボタン */}
//       <div className="mb-3">
//         <button className="btn btn-outline-primary me-2" onClick={() => changeMonth(-1)}>前月</button>
//         <span className="fw-bold">{currentMonth}</span>
//         <button className="btn btn-outline-primary ms-2" onClick={() => changeMonth(1)}>次月</button>
//       </div>

//       <table className="table table-bordered">
//         <thead className="table-dark">
//           <tr>
//             <th>日付</th>
//             <th>入金</th>
//             <th>出金</th>
//             <th>その他</th>
//             <th>摘要</th>
//             <th>相手</th>
//             <th>メモ</th>
//             <th>金額</th>
//             <th>残高</th>
//             <th>万</th>
//             <th>5千</th>
//             <th>千</th>
//             <th>5百</th>
//             <th>百</th>
//             <th>5十</th>
//             <th>十</th>
//             <th>5</th>
//             <th>1</th>
//             <th>操作</th>
//           </tr>
//         </thead>
//         <tbody>
//           {/* 繰越データ */}
//           {carryOver && (
//             <tr className="table-warning">
//               <td>繰越</td>
//               <td colSpan="7"></td>
//               <td className="fw-bold">{carryOver.TotalBalance.toLocaleString()}</td>
//               <td>{carryOver.TenThousandYen}</td>
//               <td>{carryOver.FiveThousandYen}</td>
//               <td>{carryOver.OneThousandYen}</td>
//               <td>{carryOver.FiveHundredYen}</td>
//               <td>{carryOver.OneHundredYen}</td>
//               <td>{carryOver.FiftyYen}</td>
//               <td>{carryOver.TenYen}</td>
//               <td>{carryOver.FiveYen}</td>
//               <td>{carryOver.OneYen}</td>
//               <td></td>
//             </tr>
//           )}

//           {/* 今月の取引履歴 */}
//           {history.length > 0 ? (
//             history.map((item) => (
//               <tr key={item.Id}>
//                 <td>{item.TransactionDate.split("T")[0]}</td>
//                 <td>{item.TransactionType === "入金" ? item.Amount.toLocaleString() : ""}</td>
//                 <td>{item.TransactionType === "出金" ? item.Amount.toLocaleString() : ""}</td>
//                 <td>{item.TransactionType === "その他" ? item.Amount.toLocaleString() : ""}</td>
//                 <td>{item.Summary}</td>
//                 <td>{item.Recipient}</td>
//                 <td>{item.Memo}</td>
//                 <td className="fw-bold">{item.Amount.toLocaleString()}</td>
//                 <td>{item.TotalBalance.toLocaleString()}</td>
//                 <td>{item.TenThousandYen}</td>
//                 <td>{item.FiveThousandYen}</td>
//                 <td>{item.OneThousandYen}</td>
//                 <td>{item.FiveHundredYen}</td>
//                 <td>{item.OneHundredYen}</td>
//                 <td>{item.FiftyYen}</td>
//                 <td>{item.TenYen}</td>
//                 <td>{item.FiveYen}</td>
//                 <td>{item.OneYen}</td>
//                 <td>
//                   <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.Id)}>削除</button>
//                 </td>
//               </tr>
//             ))
//           ) : (
//             <tr>
//               <td colSpan="19" className="text-center">取引データなし</td>
//             </tr>
//           )}
//         </tbody>
//       </table>
//     </div>
//   );
// };

// export default TransactionHistory;
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Modal from "react-modal";

// モーダルの設定
Modal.setAppElement("#root");

const TransactionHistory = () => {
  const [history, setHistory] = useState([]); // 取引履歴
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [carryOver, setCarryOver] = useState(null); // 繰越データ
  const [finalDenominations, setFinalDenominations] = useState({}); // 最終の金種枚数

  const historyRef = useRef([]); // 最新の履歴データを useRef で管理

  useEffect(() => {
    fetchTransactionHistory();
  }, [currentMonth]);

  // ✅ `/api/transaction-history` からデータ取得
  const fetchTransactionHistory = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/transaction-history?startDate=${currentMonth}-01`);
      console.log(`📅 ${currentMonth} の履歴取得:`, response.data.transactions);

      if (response.data.transactions.length > 0) {
        processTransactionHistory(response.data.transactions);
      } else {
        console.warn("⚠️ データなし");
        setHistory([]);
      }
    } catch (error) {
      console.error("❌ 取引履歴取得エラー:", error);
      setHistory([]);
    }
  };

  // ✅ 取引履歴の整形（繰越データを含む）
  const processTransactionHistory = (transactions) => {
    if (!transactions || transactions.length === 0) return;

    // 繰越データ（最初のレコードが繰越データの場合）
    const carryOverData = transactions.find(t => t.TransactionType === "繰越") || {
      TransactionDate: null,
      TransactionType: "繰越",
      Amount: 0,
      RunningBalance: 0,
      TenThousandYen: 0,
      FiveThousandYen: 0,
      OneThousandYen: 0,
      FiveHundredYen: 0,
      OneHundredYen: 0,
      FiftyYen: 0,
      TenYen: 0,
      FiveYen: 0,
      OneYen: 0
    };

    setCarryOver(carryOverData);

    // 繰越データ以外を履歴として設定
    const filteredTransactions = transactions.filter(t => t.TransactionType !== "繰越");

    setHistory(filteredTransactions);
    historyRef.current = filteredTransactions;
  };

  // ✅ 月を変更
  const changeMonth = (offset) => {
    const newDate = new Date(currentMonth + "-01");
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentMonth(newDate.toISOString().slice(0, 7));
  };

  return (
    <div>
      <h2>取引履歴</h2>
      <p>現在の月: {currentMonth}</p>

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
          </tr>
        </thead>
        <tbody>
          {/* 繰越データ */}
          {carryOver && (
            <tr className="table-warning">
              <td>繰越</td>
              <td colSpan="7"></td>
              <td className="fw-bold">{carryOver.RunningBalance.toLocaleString()}</td>
              <td>{carryOver.TenThousandYen}</td>
              <td>{carryOver.FiveThousandYen}</td>
              <td>{carryOver.OneThousandYen}</td>
              <td>{carryOver.FiveHundredYen}</td>
              <td>{carryOver.OneHundredYen}</td>
              <td>{carryOver.FiftyYen}</td>
              <td>{carryOver.TenYen}</td>
              <td>{carryOver.FiveYen}</td>
              <td>{carryOver.OneYen}</td>
            </tr>
          )}

          {/* 今月の取引履歴 */}
          {history.length > 0 ? (
            history.map((item) => (
              <tr key={item.Id}>
                <td>{item.TransactionDate ? item.TransactionDate.split("T")[0] : "不明"}</td>
                <td>{item.TransactionType === "入金" ? item.Amount.toLocaleString() : ""}</td>
                <td>{item.TransactionType === "出金" ? item.Amount.toLocaleString() : ""}</td>
                <td>{item.TransactionType === "その他" ? item.Amount.toLocaleString() : ""}</td>
                <td>{item.Summary}</td>
                <td>{item.Recipient}</td>
                <td>{item.Memo}</td>
                <td className="fw-bold">{item.Amount.toLocaleString()}</td>
                <td>{item.RunningBalance.toLocaleString()}</td>
                <td>{item.TenThousandYen}</td>
                <td>{item.FiveThousandYen}</td>
                <td>{item.OneThousandYen}</td>
                <td>{item.FiveHundredYen}</td>
                <td>{item.OneHundredYen}</td>
                <td>{item.FiftyYen}</td>
                <td>{item.TenYen}</td>
                <td>{item.FiveYen}</td>
                <td>{item.OneYen}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="19" className="text-center">取引データなし</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionHistory;
