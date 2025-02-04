import React, { useState } from 'react';
import CashStateTable from './CashStateTable';
import TransactionHistory from './TransactionHistory';


const CashManagementFormUI = () => {
    const [form, setForm] = useState({
        date: '',
        transactionFlow: '入金',
        amount: '',
        transactionType: '清算',
        description: '交通費',
        recipient: 'なし',
        memo: ''
    });
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // const addHistory = () => {
    //     setLoading(true);
    //     setTimeout(() => {
    //         console.log("保存されたデータ", form);
    //         setLoading(false);
    //     }, 1000);
    // };
    const handleSubmit = async () => {
        const data = {
            TransactionDate: new Date().toISOString(), // YYYY-MM-DDTHH:MM:SS.sssZ 形式
            TransactionType: form.transactionType,
            Amount: form.amount,
            Summary: form.description,
            Memo: form.memo,
            Recipient: form.recipient,
            // ✅ 金種の情報をフォームから取得するように修正
            TenThousandYen: form.tenThousandYen || 0,
            FiveThousandYen: form.fiveThousandYen || 0,
            OneThousandYen: form.oneThousandYen || 0,
            FiveHundredYen: form.fiveHundredYen || 0,
            OneHundredYen: form.oneHundredYen || 0,
            FiftyYen: form.fiftyYen || 0,
            TenYen: form.tenYen || 0,
            FiveYen: form.fiveYen || 0,
            OneYen: form.oneYen || 0
        };
    
        console.log("送信するデータ:", data); // ✅ 送信データを確認
    
        try {
            setLoading(true);  // ✅ ローディング開始
            const response = await fetch('/api/insert-transaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
    
            if (response.ok) {
                alert('データが正常に保存されました！');
            } else {
                alert('エラーが発生しました');
            }
        } catch (error) {
            console.error('エラー:', error);
        } finally {
            setLoading(false);  // ✅ ローディング終了
        }
    };
    
    

    return (
        <div className="cash-management" style={{ padding: '10px', maxWidth: '800px', margin: 'auto', fontFamily: 'Arial, sans-serif' }}>
            <div className="form-row d-flex" style={{ gap: '8px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="dateInput">日付</label>
                    <input id="dateInput" type="date" value={form.date} onChange={(e) => handleInputChange('date', e.target.value)} className="form-control" />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="transactionFlowSelect">入出金</label>
                    <select id="transactionFlowSelect" value={form.transactionFlow} onChange={(e) => handleInputChange('transactionFlow', e.target.value)} className="form-control">
                        <option value="入金">入金</option>
                        <option value="出金">出金</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="amountInput">金額</label>
                    <input id="amountInput" type="number" value={form.amount} onChange={(e) => handleInputChange('amount', e.target.value)} className="form-control" />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="transactionTypeSelect">処理内容</label>
                    <select id="transactionTypeSelect" value={form.transactionType} onChange={(e) => handleInputChange('transactionType', e.target.value)} className="form-control">
                        <option value="清算">清算</option>
                        <option value="支払">支払</option>
                        <option value="仮払">仮払</option>
                        <option value="仮払清算">仮払清算</option>
                        <option value="立替">立替</option>
                        <option value="両替">両替</option>
                        <option value="入金">入金</option>
                        <option value="調整">調整</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="descriptionSelect">摘要</label>
                    <input id="descriptionSelect" type="text" value={form.description} onChange={(e) => handleInputChange('description', e.target.value)} className="form-control" />
                </div>
                <div className="form-group" style={{ flex: '1' }}>
                    <label htmlFor="recipientSelect">相手</label>
                    <input id="recipientSelect" type="text" value={form.recipient} onChange={(e) => handleInputChange('recipient', e.target.value)} className="form-control" />
                </div>
                <div className="form-group" style={{ flex: '2' }}>
                    <label htmlFor="memoInput">メモ</label>
                    <input id="memoInput" type="text" value={form.memo} onChange={(e) => handleInputChange('memo', e.target.value)} className="form-control" />
                </div>
            </div>
              {/* 金種テーブル */}
              <div style={{ marginBottom: '5px' }}>
                
              </div>
              <CashStateTable />

              <div style={{ textAlign: "right" }}>
              <button
    className="btn btn-primary"
    onClick={handleSubmit}  // ✅ ここを変更
    disabled={loading}
>
    {loading ? "処理中..." : "保存"}
</button>


            {/* 取引履歴（幅を広くする） */}
         
             <TransactionHistory />
            
            </div>
        </div>
    );
};

export default CashManagementFormUI;
