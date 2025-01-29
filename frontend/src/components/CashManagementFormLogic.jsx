import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import CashManagementFormUI from "./CashManagementFormUI";

const API_URL = process.env.REACT_APP_API_URL;

const CashManagementFormLogic = () => {
    const initialCashState = {
        "1": 0, // 10,000円
        "2": 0, // 5,000円
        "3": 0, // 1,000円
        "4": 0, // 500円
        "5": 0, // 100円
        "6": 0, // 50円
        "7": 0, // 10円
        "8": 0, // 5円
        "9": 0, // 1円,
    };

    // denominationValuesをuseMemoでメモ化
    const denominationValues = useMemo(() => ({
        "1": 10000,
        "2": 5000,
        "3": 1000,
        "4": 500,
        "5": 100,
        "6": 50,
        "7": 10,
        "8": 5,
        "9": 1,
    }), []);  // 空の依存配列を使うことで初回のレンダリング時にのみ計算される

    const [cashState, setCashState] = useState(initialCashState);
    const [inputCounts, setInputCounts] = useState({});
    const [history, setHistory] = useState([]);
    const [carryOver, setCarryOver] = useState(null);
    const [form, setForm] = useState({
        date: "",
        amount: "",
        memo: "",
        transactionType: "清算",
        description: "交通費",
        recipient: "なし",
    });
    const [difference, setDifference] = useState(0);
    const [loading, setLoading] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

    // 合計金額を計算
    const calculateTotal = useCallback((state) => {
        return Object.entries(state).reduce((total, [denominationID, count]) => {
            const denominationValue = denominationValues[denominationID] || 0;
            return total + denominationValue * count;
        }, 0);
    }, [denominationValues]);  // 'denominationValues' を依存関係として追加

    // 金庫状態を取得
    useEffect(() => {
        const fetchCashState = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/cashState`);
                setCashState(response.data);
            } catch (error) {
                console.error("金庫状態取得エラー:", error);
            }
        };
        fetchCashState();
    }, []);

    // 履歴の取得と前月繰越の設定
    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const currentResponse = await axios.get(`${API_URL}/api/history`, {
                params: { year: currentYear, month: currentMonth },
            });
            const currentData = currentResponse.data;

            const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
            const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

            const previousResponse = await axios.get(`${API_URL}/api/history`, {
                params: { year: previousYear, month: previousMonth },
            });
            const previousHistory = previousResponse.data;

            const lastCarryOver =
                previousHistory.length > 0
                    ? previousHistory[previousHistory.length - 1]
                    : null;

            setHistory(currentData || []);
            setCarryOver(lastCarryOver);
        } catch (error) {
            console.error("履歴取得エラー:", error.message || error);
        } finally {
            setLoading(false);
        }
    }, [currentYear, currentMonth]);

    // 現在の年月が変更されたら履歴を再取得
    useEffect(() => {
        fetchHistory();
    }, [currentYear, currentMonth, fetchHistory]);

    // 差額をリアルタイム更新
    useEffect(() => {
        const totalWithInputs = calculateTotal(
            Object.entries(cashState).reduce((acc, [key, value]) => {
                const inputValue = inputCounts[key] || 0;
                acc[key] = value + inputValue;
                return acc;
            }, {})
        );
        const totalWithoutInputs = calculateTotal(cashState);
        setDifference(totalWithInputs - totalWithoutInputs);
    }, [cashState, inputCounts, calculateTotal]);

    // 履歴の追加
    const addHistory = async () => {
        const { date, amount } = form;
        const parsedAmount = Number(amount);

        if (!date) {
            alert("日付を入力してください。");
            return;
        }

        const requestData = {
            TransactionDate: date,
            Amount: isNaN(parsedAmount) ? 0 : parsedAmount,
            TransactionType: form.transactionType || "その他",
            Description: form.description || "なし",
            Recipient: form.recipient || "なし",
            Memo: form.memo || "",
            CashState: inputCounts || {},
        };

        try {
            setLoading(true);

            const response = await axios.post(`${API_URL}/api/settlement`, requestData);

            if (response.status === 201) {
                setCashState(response.data.cashState);
                await fetchHistory();
                resetForm();
                alert("✅ 清算が正常に完了しました");
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            alert(`❌ 清算エラー: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setForm({
            date: "",
            amount: "",
            memo: "",
            transactionType: "清算",
            description: "交通費",
            recipient: "なし",
        });
        setInputCounts({});
    };

    const handleInputChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    const updateCashState = (denomination, value) => {
        const parsedValue = parseInt(value, 10);
        setInputCounts((prevState) => ({
            ...prevState,
            [denomination]: isNaN(parsedValue) ? 0 : parsedValue,
        }));
    };

    const deleteHistory = async (id) => {
        if (!window.confirm("本当にこの履歴を削除しますか？")) return;

        try {
            setLoading(true);

            await axios.delete(`${API_URL}/api/history/${id}`);
            alert("履歴が削除されました");
            await fetchHistory();
            const response = await axios.get(`${API_URL}/api/cashState`);
            setCashState(response.data);
        } catch (error) {
            console.error("履歴削除エラー:", error);
            alert("履歴の削除に失敗しました");
        } finally {
            setLoading(false);
        }
    };

    return (
        <CashManagementFormUI
            cashState={cashState}
            inputCounts={inputCounts}
            form={form}
            difference={difference}
            handleInputChange={handleInputChange}
            updateCashState={updateCashState}
            addHistory={addHistory}
            deleteHistory={deleteHistory}
            history={history}
            carryOver={carryOver}
            calculateTotal={calculateTotal}
            loading={loading}
            currentYear={currentYear}
            currentMonth={currentMonth}
            handlePreviousMonth={() => {
                setCurrentMonth((prevMonth) => (prevMonth === 1 ? 12 : prevMonth - 1));
                if (currentMonth === 1) setCurrentYear((prevYear) => prevYear - 1);
            }}
            handleNextMonth={() => {
                setCurrentMonth((prevMonth) => (prevMonth === 12 ? 1 : prevMonth + 1));
                if (currentMonth === 12) setCurrentYear((prevYear) => prevYear + 1);
            }}
        />
    );
};

export default CashManagementFormLogic;
