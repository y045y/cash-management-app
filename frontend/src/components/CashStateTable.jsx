import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/cashStateTable.css"; // ✅ カスタム CSS を適用

// const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
const API_URL = "https://cashmanagement-app-ahhjctexgrbbgce2.japaneast-01.azurewebsites.net";

// ✅ 金種の単価
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

// ✅ 金種のラベル
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

const CashStateTable = ({ inputCounts, setInputCounts, setDifference }) => {
    const [cashState, setCashState] = useState({});
    const [error, setError] = useState(null);

    // ✅ 金種データのキーを統一するためのマッピング関数
    const mapCashStateKeys = (data) => {
        return {
            TenThousandYen: data.TotalTenThousandYen || 0,
            FiveThousandYen: data.TotalFiveThousandYen || 0,
            OneThousandYen: data.TotalOneThousandYen || 0,
            FiveHundredYen: data.TotalFiveHundredYen || 0,
            OneHundredYen: data.TotalOneHundredYen || 0,
            FiftyYen: data.TotalFiftyYen || 0,
            TenYen: data.TotalTenYen || 0,
            FiveYen: data.TotalFiveYen || 0,
            OneYen: data.TotalOneYen || 0,
        };
    };

    // ✅ 金庫の現在状態を取得
    const fetchCashState = useCallback(async () => {
        try {
            const response = await axios.get(`${API_URL}/api/current-inventory`, { timeout: 10000 });
            if (response.data) {
                setCashState(mapCashStateKeys(response.data));  // 🔹 変換後のデータをセット
                console.log("📌 更新後の金庫状態 (setCashState):", mapCashStateKeys(response.data));
            } else {
                setCashState({});
                setError("データが取得できませんでした。");
            }
        } catch (error) {
            console.error("❌ 金庫状態取得エラー:", error);
            setError("金庫状態の取得に失敗しました。");
        }
    }, [setCashState]);  // 🔥 `useCallback` に `setCashState` を依存配列として追加

    // ✅ `fetchCashState` を `useEffect` の依存関係に入れても大丈夫
    useEffect(() => {
        fetchCashState();
    }, [fetchCashState]);  

    // ✅ 現在の金額を計算（金種 × 現在枚数）
    const calculateTotalAmount = () => {
        return Object.entries(denominationValues).reduce(
            (total, [denomination, value]) => total + (cashState[denomination] || 0) * value,
            0
        );
    };

    // ✅ 入力金額の計算
    const calculateInputAmount = useCallback(() => {
        const total = Object.entries(inputCounts).reduce(
            (sum, [denomination, count]) => sum + (denominationValues[denomination] || 0) * (count || 0),
            0
        );
    
        console.log("📌 計算した差額 (difference):", total);
        return total;
    }, [inputCounts]);  // 🔹 `inputCounts` に依存
    
    // ✅ `calculateInputAmount` を `useEffect` の依存配列に入れても安全になる
    useEffect(() => {
        setDifference(calculateInputAmount());
    }, [calculateInputAmount, setDifference]);  // 🔥 `calculateInputAmount` を依存配列に追加
    

    // ✅ 金種の増減ボタン
    const adjustCount = (denomination, delta) => {
        setInputCounts((prev) => ({
            ...prev,
            [denomination]: (prev[denomination] || 0) + delta,
        }));
    };

    return (
        <div className="container mt-3">
            {error && <p className="text-danger text-center">{error}</p>}

            <table className="fs-5 table table-bordered table-hover table-striped table-sm text-center cash-state-table">
                <thead className="table-success">
                    <tr>
                        <th>金種</th>
                        <th>現在枚数</th>
                        <th>入力枚数</th>
                    </tr>
                </thead>
                <tbody>
                    {Object.entries(denominationLabels).map(([denomination, label]) => (
                        <tr key={denomination}>
                            <td className="fs-4">{label}</td>
                            <td className="fs-4">{cashState[denomination] !== undefined ? cashState[denomination] : 0}</td>
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
                                        onChange={(e) => setInputCounts({ ...inputCounts, [denomination]: parseInt(e.target.value, 10) || 0 })} 
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
                    ))}
                </tbody>

                {/* ✅ 現金と差額を表示 */}
                <tfoot>
                    <tr>
                        <td colSpan="2" className="fs-4 text-end fw-bold">現金:</td>
                        <td className="fs-4 fw-bold">¥{calculateTotalAmount().toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td colSpan="2" className="fs-4 text-end fw-bold">差額:</td>
                        <td className="fs-4 fw-bold text-danger">¥{calculateInputAmount().toLocaleString()}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

export default CashStateTable;
