import React from 'react';
import { pdf } from '@react-pdf/renderer';
import CashManagementPDF from './CashManagementPDF'; // ✅ PDF用コンポーネントをインポート

const PDFButton = ({ transactions, currentMonth }) => {
  const generatePDF = async () => {
    if (!transactions || transactions.length === 0) {
      alert("❌ 取引履歴がありません！");
      return;
    }

    // ✅ 繰越データ (最初の行) を分離
    const previousCarryOver = transactions[0].TransactionType === "繰越" ? transactions[0] : null;
    const transactionHistory = previousCarryOver ? transactions.slice(1) : transactions;

    const blob = await pdf(
      <CashManagementPDF
        history={transactionHistory}
        currentMonth={currentMonth}
        previousCarryOver={previousCarryOver}  // ✅ 繰越データを渡す
      />
    ).toBlob();

    // ✅ ファイル名に現在の日付を入れる
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `金庫管理履歴表_${currentMonth}月分_${currentDate}.pdf`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  };

  return (
    <button onClick={generatePDF} className="btn btn-primary">
      履歴PDF
    </button>
  );
};

export default PDFButton;
