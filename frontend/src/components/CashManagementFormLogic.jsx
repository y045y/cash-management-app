import React, { useState, useEffect } from "react";
import axios from "axios";
import CashStateTable from "./CashStateTable";

const API_URL = process.env.REACT_APP_API_URL;

const CashManagementFormLogic = () => {
    const [cashState, setCashState] = useState({});
    const [inputCounts, setInputCounts] = useState({});

    useEffect(() => {
        const fetchCashState = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/cashState`);
                setCashState(response.data.CurrentInventory || {});
                setInputCounts(Object.fromEntries(Object.keys(response.data.CurrentInventory || {}).map(key => [key, 0])));
            } catch (error) {
                console.error("金庫状態取得エラー:", error);
            }
        };
        fetchCashState();
    }, []);

    return (
        <div>
            <h2>金庫状態管理</h2>
            <CashStateTable cashState={cashState} setCashState={setCashState} inputCounts={inputCounts} setInputCounts={setInputCounts} />
        </div>
    );
};

export default CashManagementFormLogic;
