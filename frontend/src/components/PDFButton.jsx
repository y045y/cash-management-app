import React from 'react';
import { pdf } from '@react-pdf/renderer';
import CashManagementPDF from './CashManagementPDF';

const PDFButton = ({ history, currentMonth, previousCarryOver }) => {
  const generatePDF = async () => {
    const blob = await pdf(
      <CashManagementPDF
        history={history}
        currentMonth={currentMonth}
        previousCarryOver={previousCarryOver}
      />
    ).toBlob();

    // 現在日付を取得してファイル名に使用
    const currentDate = new Date().toISOString().split('T')[0].replace(/-/g, ''); // 例: 20250125
    const fileName = `金庫管理履歴表${currentMonth}月分_${currentDate}.pdf`;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName; // ここでファイル名を指定
    link.click();
  };

  return (
    <button onClick={generatePDF} className="btn btn-primary">
      PDFをダウンロード
    </button>
  );
};

export default PDFButton;
