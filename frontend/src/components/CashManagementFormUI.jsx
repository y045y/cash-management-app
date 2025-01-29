import React from 'react';
import CashStateTable from './CashStateTable';
import TransactionHistory from './TransactionHistory';

const CashManagementFormUI = ({
    cashState,
    inputCounts,
    form,
    difference,
    handleInputChange,
    updateCashState,
    addHistory,
    deleteHistory,
    history,
    carryOver,
    calculateTotal,
    loading,
    handlePreviousMonth,
    handleNextMonth,
    currentYear,
    currentMonth,
}) => {
    const totalAmount = calculateTotal(cashState, inputCounts);

    return (
        <div
            className="cash-management"
            style={{
                padding: '10px',
                maxWidth: '1000px',
                margin: 'auto',
                fontFamily: 'Arial, sans-serif',
                fontSize: '16px',
            }}
        >
            <h3
                className="text-center font-weight-bold mb-3"
                style={{ fontSize: '24px', color: '#333', fontWeight: 'bold', marginBottom: '20px' }}
            >
                金庫状態管理
            </h3>

            {/* 横一列のフォームセクション */}
            <div
                className="form-row mb-3 d-flex align-items-center"
                style={{
                    display: 'flex',
                    gap: '8px',
                }}
            >
                <div className="form-group" style={{ flex: '0 0 120px' }}>
                    <label htmlFor="dateInput" style={{ fontWeight: 'bold' }}>日付</label>
                    <input
                        id="dateInput"
                        type="date"
                        value={form.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                        aria-label="日付を入力"
                    />
                </div>
                <div className="form-group" style={{ flex: '0 0 100px' }}>
                    <label htmlFor="amountInput" style={{ fontWeight: 'bold' }}>金額</label>
                    <input
                        id="amountInput"
                        type="number"
                        value={form.amount}
                        onChange={(e) => handleInputChange('amount', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                        aria-label="金額を入力"
                    />
                </div>
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label htmlFor="transactionTypeSelect" style={{ fontWeight: 'bold' }}>処理内容</label>
                    <select
                        id="transactionTypeSelect"
                        value={form.transactionType}
                        onChange={(e) => handleInputChange('transactionType', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                    >
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
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label htmlFor="descriptionSelect" style={{ fontWeight: 'bold' }}>摘要</label>
                    <select
                        id="descriptionSelect"
                        value={form.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                    >
                        <option value="交通費">交通費</option>
                        <option value="会議費">会議費</option>
                        <option value="立替交通費">立替交通費</option>
                        <option value="その他">その他</option>
                    </select>
                </div>
                <div className="form-group" style={{ flex: '0 0 140px' }}>
                    <label htmlFor="recipientSelect" style={{ fontWeight: 'bold' }}>相手</label>
                    <select
                        id="recipientSelect"
                        value={form.recipient}
                        onChange={(e) => handleInputChange('recipient', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                    >
                        {['なし', '佐脇良尚', '近松周也', '白井', '倉内', '杉山', '日野', '島村', '宮崎','小林','林'].map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                    <label htmlFor="memoInput" style={{ fontWeight: 'bold' }}>メモ</label>
                    <input
                        id="memoInput"
                        type="text"
                        value={form.memo}
                        onChange={(e) => handleInputChange('memo', e.target.value)}
                        className="form-control"
                        style={{
                            fontSize: '14px',
                        }}
                        aria-label="メモを入力"
                    />
                </div>
            </div>

            {/* 金種テーブル */}
            <CashStateTable
                cashState={cashState}
                inputCounts={inputCounts}
                handleInputChange={(denomination, value) => {
                    const parsedValue = parseInt(value, 10);
                    if (isNaN(parsedValue)) {
                        alert('有効な数値を入力してください');
                        return;
                    }
                    updateCashState(denomination, parsedValue);
                }}
            />

            {/* 合計金額と差額 */}
            <div
                className="mt-3 d-flex align-items-center justify-content-end"
                style={{
                    gap: '10px',
                }}
            >
                <h4
                    className="font-weight-bold"
                    style={{
                        color: '#444',
                        fontSize: '18px',
                        margin: 0,
                    }}
                >
                    合計金額: ¥{totalAmount.toLocaleString()}
                </h4>
                <h4
                    style={{
                        color: '#555',
                        fontSize: '18px',
                        margin: 0,
                    }}
                >
                    差額: ¥{difference.toLocaleString()}
                </h4>
                <button
                    className="btn btn-primary"
                    onClick={addHistory}
                    disabled={loading}
                    style={{
                        fontSize: '14px',
                        padding: '8px 16px',
                        borderRadius: '5px',
                        width: '120px',
                    }}
                >
                    {loading ? '処理中...' : '清算'}
                </button>
            </div>

            {/* 履歴表示テーブル */}
            <div className="mt-4">
                <TransactionHistory
                    history={history}
                    deleteHistory={deleteHistory}
                    handleNextMonth={handleNextMonth}
                    handlePreviousMonth={handlePreviousMonth}
                    previousCarryOver={carryOver || {}} // 初期値を設定
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />
            </div>
        </div>
    );
};

export default CashManagementFormUI;
