import { useState, useEffect } from 'react';
import axios from 'axios';

export const useCashState = () => {
    const [cashState, setCashState] = useState({
        '10000': 0, '5000': 0, '1000': 0,
        '500': 0, '100': 0, '50': 0,
        '10': 0, '5': 0, '1': 0
    });
    const [inputCounts, setInputCounts] = useState(Object.fromEntries(Object.keys(cashState).map(key => [key, 0])));
    const [history, setHistory] = useState([]);
    const [date, setDate] = useState("");
    const [amount, setAmount] = useState(0);
    const [memo, setMemo] = useState("");
    const [transactionType, setTransactionType] = useState("清算");
    const [description, setDescription] = useState("交通費");
    const [recipient, setRecipient] = useState("なし");
    const [difference, setDifference] = useState(0);

    useEffect(() => {
        axios.get('http://localhost:5000/history')
            .then(response => setHistory(response.data))
            .catch(error => console.error('履歴の取得エラー:', error));
    }, []);

    const calculateTotal = (state) => {
        return Object.entries(state).reduce((total, [denomination, count]) => total + parseInt(denomination) * count, 0);
    };

    const calculateDifference = (updatedCashState) => {
        if (history.length === 0) return 0;
        const lastAmount = history[0]?.totalAmount || 0;
        const currentAmount = calculateTotal(updatedCashState);
        return currentAmount - lastAmount;
    };

    const updateCashState = (denomination, count) => {
        setCashState(prevState => {
            const updatedState = { ...prevState, [denomination]: prevState[denomination] + count };
            setDifference(calculateDifference(updatedState));
            return updatedState;
        });
    };

    const addHistory = async () => {
        const parsedAmount = parseInt(amount, 10);
        if (!date || isNaN(parsedAmount) || parsedAmount <= 0) {
            alert("正しい日付と金額を入力してください。");
            return;
        }

        const totalAmount = calculateTotal(cashState);
        const newDifference = calculateDifference(cashState);

        const newHistory = {
            date,
            amount: parsedAmount,
            transactionType,
            description,
            recipient,
            memo,
            cashState: { ...cashState },
            totalAmount,
            difference: newDifference
        };

        try {
            const response = await axios.post('http://localhost:5000/addhistory', newHistory);
            if (response.status === 201) {
                setHistory([newHistory, ...history]);
                setInputCounts(Object.fromEntries(Object.keys(cashState).map(key => [key, 0])));
                setDate("");
                setAmount(0);
                setDescription("交通費");
                setRecipient("なし");
                setMemo("");
                setDifference(0);
                alert('履歴が正常に追加されました');
            }
        } catch (error) {
            alert('履歴の追加エラー: ' + error.message);
        }
    };

    const deleteHistory = async (index) => {
        const deletedEntry = history[index];
        try {
            await axios.delete(`http://localhost:5000/deletehistory/${deletedEntry.id}`);
            setHistory(history.filter((_, i) => i !== index));
            alert('履歴が削除されました');
        } catch (error) {
            alert('履歴の削除エラー: ' + error.message);
        }
    };

    return {
        cashState,
        inputCounts,
        history,
        date,
        amount,
        memo,
        transactionType,
        description,
        recipient,
        difference,
        setDate,
        setAmount,
        setMemo,
        setTransactionType,
        setDescription,
        setRecipient,
        addHistory,
        deleteHistory,
        updateCashState,
        calculateTotal,
        setInputCounts
    };
};
