import React, { useState, useEffect } from "react";
import CashStateTable from "./CashStateTable";
import TransactionHistory from "./TransactionHistory";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/cashManagementForm.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
// const API_URL = "https://cashmanagement-app-ahhjctexgrbbgce2.japaneast-01.azurewebsites.net";

const CashManagementFormUI = () => {
    const [difference, setDifference] = useState(0); 
    const [loading, setLoading] = useState(false);
    const [transactions, setTransactions] = useState([]);
    const [inputCounts, setInputCounts] = useState({});
    const [cashState, setCashState] = useState({});

    const [form, setForm] = useState({
        date: "",
        amount: 0,
        transactionType: "出金",
        summary: "交通費",
        recipient: "会社",
        memo: "",
    });

    const fetchTransactions = async () => {
        try {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 1); // 先月も含める
            startDate.setDate(1); // 先月の1日から取得
    
            const endDate = new Date().toISOString().slice(0, 10); // 今日の日付
    
            const response = await axios.get(`${API_URL}/api/transaction-history?startDate=${startDate.toISOString().slice(0, 10)}&endDate=${endDate}`);
    
           // console.log("📌 取得した取引履歴:", response.data.transactions);
    
            setTransactions(response.data.transactions || []);
        } catch (error) {
            //console.error("❌ 取引履歴取得エラー:", error);
        }
    };
    

    const fetchCashState = async () => {
        try {
            const response = await axios.get(`${API_URL}/api/current-inventory`, { timeout: 10000 });
    
            if (response.status === 200 && response.data) {
               // console.log("📌 取得した金庫状態:", response.data);
                setCashState(response.data);
            } else {
              //  console.error("⚠️ 金庫状態の取得に失敗しました。レスポンス:", response);
            }
        } catch (error) {
            //console.error("❌ 金庫状態取得エラー:", error);
        }
    };
    
    useEffect(() => {
        fetchTransactions();
        fetchCashState();
    }, []);
        // 🔹 取引履歴が更新されたらログを出力
   
    useEffect(() => {
        //console.log("📌 取引履歴が更新されました:", transactions);
    }, [transactions]);
    
        // 🔹 金庫状態が更新されたらログを出力
    useEffect(() => {
           // console.log("📌 現在の金庫状態が更新されました:", cashState);
    }, [cashState]);

    const handleSubmit = async () => {
        const transactionAmount = isNaN(difference) ? 0 : 
            (form.transactionType === "出金" ? -Math.abs(difference) : Math.abs(difference));
    
        const correctedAmount = Math.abs(form.amount);
    
        if (Math.abs(transactionAmount) !== correctedAmount) {
            alert(`エラー: 入力金額 (${correctedAmount}) と 差額 (${transactionAmount}) が一致しません！`);
            return;
        }
    
        //console.log("📌 送信前のデータ:", { ...form, Amount: transactionAmount });
    
        const data = {
            TransactionDate: form.date,
            TransactionType: form.transactionType,
            Amount: transactionAmount,
            Summary: form.summary,
            Memo: form.memo,
            Recipient: form.recipient,
            TenThousandYen: inputCounts.TenThousandYen || 0,
            FiveThousandYen: inputCounts.FiveThousandYen || 0,
            OneThousandYen: inputCounts.OneThousandYen || 0,
            FiveHundredYen: inputCounts.FiveHundredYen || 0,
            OneHundredYen: inputCounts.OneHundredYen || 0,
            FiftyYen: inputCounts.FiftyYen || 0,
            TenYen: inputCounts.TenYen || 0,
            FiveYen: inputCounts.FiveYen || 0,
            OneYen: inputCounts.OneYen || 0,
        };
        
        //console.log("📌 API に送信するデータ:", data);
    
        try {
            setLoading(true);
            const response = await axios.post(`${API_URL}/api/insert-transaction`, data);
    
          //  console.log("📌 API レスポンス:", response.data);
    
            if (response.status === 200 && response.data.data.length > 0) {
                alert("データが正常に保存されました！");
    
            //    console.log("📌 追加する取引データ:", response.data.data[0]);
    
                // ✅ 最新の取引履歴と金庫状態を取得 (同期的に実行)
                await fetchTransactions();  // ここでしっかりデータ取得を待つ
                await fetchCashState();     // 金庫状態も取得
    
                // ✅ 手動で最新データをセット (フロントエンドのUI反映)
                setTransactions(prev => {
                    const updatedTransactions = [...prev, response.data.data[0]];
              //      console.log("📌 更新後の取引履歴:", updatedTransactions);
                    return updatedTransactions;
                });
    
                setCashState(prev => {
                    const updatedCashState = { ...prev, ...response.data.data[0] };
                //    console.log("📌 更新後の金庫状態:", updatedCashState);
                    return updatedCashState;
                });
    
                setForm({
                    date: "",
                    amount: 0,
                    transactionType: "出金",
                    summary: "交通費",
                    recipient: "なし",
                    memo: "",
                });
    
                setInputCounts({});
            } else {
                alert("エラーが発生しました");
            }
        } catch (error) {
            //console.error("❌ エラー:", error);
        } finally {
            setLoading(false);
        }
    };
    
    
    // ✅ 取引履歴の変化を監視
    useEffect(() => {
       // console.log("📌 取引履歴が更新されました:", transactions);
    }, [transactions]);
    
    // ✅ 現在の金庫状態の変化を監視
    useEffect(() => {
        //console.log("📌 現在の金庫状態が更新されました:", cashState);
    }, [cashState]);
    
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


    return (
        <div className="container mt-4 p-3 bg-light rounded shadow-sm">
            {/* タイトル */}
            <h3 className="text-center mb-3">金庫管理システム</h3>

            {/* フォーム入力エリア */}
            <form>
                <div className="row g-3 align-items-center">

                    {/* 日付入力 */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">日付</label>
                        <input
                            type="date"
                            value={form.date}
                            onChange={(e) => setForm({ ...form, date: e.target.value })}
                            className="form-control"
                        />
                    </div>

                    {/* 取引タイプ */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">取引タイプ</label>
                        <select
                            value={form.transactionType}
                            onChange={(e) => {
                                const newTransactionType = e.target.value;
                                //console.log("📌 取引タイプ変更:", newTransactionType); // 🔹 ここでログを出力
                                setForm({ ...form, transactionType: newTransactionType });
                            }}
                            className="form-select"
                        >
                            <option value="出金">出金</option>
                            <option value="入金">入金</option>
                        </select>
                    </div>

                    {/* 金額入力 */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">金額</label>
                        <input
                            type="number"
                            value={form.amount}
                            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                            className="form-control"
                            placeholder="金額を入力"
                        />
                    </div>

                    {/* 取引先 */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">相手</label>
                        <select
                            value={form.recipient}
                            onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                            className="form-select"
                        >
                            <option value="会社">会社</option>
                            <option value="佐脇">佐脇</option>
                            <option value="近松">近松</option>
                            <option value="白井">白井</option>
                            <option value="倉内">倉内</option>
                            <option value="杉山">杉山</option>
                            <option value="島村">島村</option>
                            <option value="日野">日野</option>
                            <option value="佐藤">佐藤</option>
                            <option value="宮崎">宮崎</option>
                            <option value="古川">古川</option>
                            <option value="大木">大木</option>
                            <option value="酒井">酒井</option>
                            <option value="林">林</option>
                            <option value="小林">小林</option>
                    
                        </select>
                    </div>

                    {/* 摘要 */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">摘要</label>
                        <select
                            value={form.summary}
                            onChange={(e) => setForm({ ...form, summary: e.target.value })}
                            className="form-select"
                        >
                            <option value="交通費">交通費</option>
                            <option value="支払">支払</option>
                            <option value="その他">その他</option>
                            <option value="その他">立替</option>
                            <option value="仮払">仮払</option>
                            <option value="仮払清算">仮払清算</option>
                            <option value="小口入金">小口入金</option>
                            <option value="両替">両替</option>
                            <option value="調整">調整</option>
                        </select>
                    </div>

                    {/* メモ */}
                    <div className="col-md-2">
                        <label className="form-label fw-bold">メモ</label>
                        <input
                            type="text"
                            value={form.memo}
                            onChange={(e) => setForm({ ...form, memo: e.target.value })}
                            className="form-control"
                            placeholder="メモを入力"
                        />
                    </div>
                </div>
            </form>

            {/* ✅ 金種入力テーブル */}
            <CashStateTable 
                inputCounts={inputCounts} 
                cashState={cashState} 
                fetchCashState={fetchCashState} 
                setInputCounts={setInputCounts} 
                setDifference={setDifference} 
            />

            {/* 保存ボタン */}
            <div className="text-end mt-3">
                <button className="btn btn-primary px-4" onClick={handleSubmit} disabled={loading}>
                    {loading ? "処理中..." : "保存"}
                </button>
            </div>

           {/* ✅ 取引履歴テーブル */}
            <div className="mt-4">
                <TransactionHistory 
                    transactions={transactions} 
                    fetchTransactions={fetchTransactions}  
                    fetchCashState={fetchCashState} 
                />
            </div>
        </div>
    );
};

export default CashManagementFormUI;
