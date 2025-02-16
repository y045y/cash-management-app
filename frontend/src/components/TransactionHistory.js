import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import PDFButton from "./PDFButton"; // ✅ PDFダウンロードボタンを追加
import "bootstrap/dist/css/bootstrap.min.css"; // ✅ Bootstrap を適用

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
//const API_URL = "https://cashmanagement-app-ahhjctexgrbbgce2.japaneast-01.azurewebsites.net";

const TransactionHistory = ({ fetchTransactions, fetchCashState }) => {
    const [transactions, setTransactions] = useState([]);
    const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7));
    const [error, setError] = useState(null);


    // ✅ `useCallback` を使用して関数をメモ化
    const fetchTransactionsData = useCallback(async (retryCount = 3) => {
        try {
            const response = await axios.get(`${API_URL}/api/transaction-history?startDate=${currentMonth}-01`, { timeout: 10000 });
            // console.log("📌 取得したデータ:", response.data);
    
            if (response.data && response.data.transactions) {
                setTransactions(response.data.transactions);
            } else {
                setTransactions([]);
                setError("データが取得できませんでした。");
            }
        } catch (error) {
            console.error("❌ 取引履歴取得エラー:", error);
            if (retryCount > 0) {
                console.warn(`リトライ中... 残り ${retryCount} 回`);
                setTimeout(() => fetchTransactionsData(retryCount - 1), 2000);
            } else {
                setError("取引履歴の取得に失敗しました。サーバーを確認してください。");
            }
        }
    }, [currentMonth, setTransactions, setError]);  // 🔥 `currentMonth`, `setTransactions`, `setError` を依存配列に追加
    
    // ✅ `fetchTransactionsData` を `useEffect` の依存配列に含める
    useEffect(() => {
        fetchTransactionsData();
    }, [fetchTransactionsData]);  // 🔥 `fetchTransactionsData` を依存配列に含める
    

    const handleDelete = async (transactionId) => {
        if (!transactionId) {
            console.error("❌ 削除エラー: TransactionID が `undefined` です。");
            alert("エラー: 削除する取引IDが取得できませんでした。");
            return;
        }
    
        // console.log("🗑 削除リクエスト送信:", transactionId);
    
        if (!window.confirm("この取引を削除しますか？")) return;
    
        try {
            const response = await axios.delete(`${API_URL}/api/transactions/${transactionId}`);
    
            if (response.status === 200) {
                alert("取引が削除されました！");
    
                // console.log("📌 fetchTransactions を実行");
                await fetchTransactions(); // ✅ 取引履歴の更新
                
                if (typeof fetchCashState === "function") {
                    // console.log("📌 fetchCashState を実行");
                    await fetchCashState(); // ✅ 金庫状態の更新
                } else {
                    console.warn("⚠ fetchCashState が未定義のため、金庫状態を更新できません。");
                }
            } else {
                alert("削除に失敗しました。");
            }
        } catch (error) {
            console.error("❌ 削除エラー:", error);
            alert("エラーが発生しました。");
        }
    };
    const exportToCSV = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/export-transactions`, {
                responseType: 'blob' // バイナリデータ（CSV）として受け取る
            });
    
            // ダウンロードリンクを作成してクリック
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([response.data])); // CSVデータをBlobとして扱う
            link.download = 'transactions.csv'; // ファイル名を指定
            link.click();
        } catch (error) {
            console.error("❌ CSVダウンロードエラー:", error);
        }
    };
    
    const exportToDenominationsCSV = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/export-denominations`, {
                responseType: 'blob' // バイナリデータ（CSV）として受け取る
            });
    
            // ダウンロードリンクを作成してクリック
            const link = document.createElement('a');
            link.href = URL.createObjectURL(new Blob([response.data])); // CSVデータをBlobとして扱う
            link.download = 'denominations.csv'; // ファイル名を指定
            link.click();
        } catch (error) {
            console.error("❌ CSVダウンロードエラー:", error);
        }
    };
    
    
    
    
    return (
        <div className="container">
            {error && <p className="text-danger text-center">{error}</p>}

            <div className="d-flex justify-content-end my-3">
                <button className="btn btn-outline-primary me-2" onClick={() => setCurrentMonth(prev => 
                    new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() - 1)).toISOString().slice(0, 7))
                }>
                    ◀ 前月
                </button>
                <button className="btn btn-outline-secondary me-2" onClick={() => setCurrentMonth(new Date().toISOString().slice(0, 7))}>
                    📅 当月
                </button>
                <button className="btn btn-outline-primary me-2" onClick={() => setCurrentMonth(prev => 
                    new Date(new Date(prev + "-01").setMonth(new Date(prev + "-01").getMonth() + 1)).toISOString().slice(0, 7))
                }>
                    次月 ▶
                </button>
                {/* ✅ CSVエクスポートボタン */}
                <button className="btn btn-success" onClick={exportToCSV}>
                    履歴CSVEx
                </button>
                {/* ✅ Denominations CSVエクスポートボタン */}
                <button className="btn btn-info" onClick={exportToDenominationsCSV}>
                    金種CSVEx
                </button>
                <PDFButton transactions={transactions} currentMonth={currentMonth} />
            </div>


            {/* ✅ 取引履歴テーブル */}
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
                        {transactions.length > 0 ? (
                            transactions.map((tx, index) => (
                                <tr key={index}>
                                    <td>{tx.TransactionDate ? new Date(tx.TransactionDate).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }) : "N/A"}</td>
                                    <td className="text-end">{tx.Amount !== null ? `${tx.Amount < 0 ? "-" : ""}${Math.abs(tx.Amount).toLocaleString()}` : "N/A"}</td>
                                    <td className="text-end">{tx.RunningBalance !== null ? `${tx.RunningBalance.toLocaleString()}` : "N/A"}</td>
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
        className="btn btn-sm btn-danger" 
        onClick={() => {
            // console.log("🛠 削除しようとしている取引データ:", tx); // 🔍 `tx` のデータを確認
            // console.log("🛠 削除対象の TransactionID:", tx.TransactionID); // 🔍 `TransactionID` が正しいか確認
            handleDelete(tx.TransactionID);
        }}
    >
        🗑 削除
    </button>
</td>


                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="16" className="text-center">取引データなし</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TransactionHistory;
