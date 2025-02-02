import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// フォントの登録
Font.register({
  family: 'NotoSansJP',
  src: '/fonts/NotoSansJP-Regular.ttf',
});

// スタイル設定
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'NotoSansJP',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderCollapse: 'collapse',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    height: 30, // ✅ 行の高さを固定
    alignItems: 'center', // ✅ 行の高さを統一するために中央揃え
  },
  tableCell: {
    padding: 4, // ✅ ヘッダーとデータ部分のpaddingを統一
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    fontSize: 10,
    textAlign: 'center',
    flexGrow: 0, // ✅ 伸縮を防止
    flexShrink: 0, // ✅ 収縮を防止
  },
  // ✅ カラム幅を統一
  dateCell: { width: 50 },
  typeCell: { width: 60 },
  amountCell: { width: 70 },
  summaryCell: { width: 100 },
  recipientCell: { width: 100 },
  memoCell: { width: 100 },
  balanceCell: { width: 80 },
  currencyCell: { width: 35 }, // ✅ 金種の列幅を統一
});

const CashManagementPDF = ({ history = [], previousCarryOver = {}, currentMonth }) => {
  const formatNumber = (number) => (number != null ? new Intl.NumberFormat('ja-JP').format(number) : '0');
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  

  // 🔹 `現在残高` を history の最後の `RunningBalance` から取得
  const finalBalance =
    history.length > 0 ? history[history.length - 1].RunningBalance : previousCarryOver.RunningBalance || 0;

  return (
    <Document>
      <Page style={styles.page} size={{ width: 841.89, height: 595.28 }}>
        <Text style={styles.title}>金庫管理レポート ({currentMonth}月)</Text>
        <View style={styles.table}>
          {/* ✅ ヘッダー部分 */}
          <View style={[styles.tableRow, styles.headerCell]}>
            <Text style={[styles.tableCell, styles.dateCell]}>日付</Text>
            <Text style={[styles.tableCell, styles.typeCell]}>処理</Text>
            <Text style={[styles.tableCell, styles.amountCell]}>金額</Text>
            <Text style={[styles.tableCell, styles.summaryCell]}>摘要</Text>
            <Text style={[styles.tableCell, styles.recipientCell]}>相手</Text>
            <Text style={[styles.tableCell, styles.memoCell]}>メモ</Text>
            <Text style={[styles.tableCell, styles.balanceCell]}>残高</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>万</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>5千</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>千</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>5百</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>百</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>5十</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>十</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>5</Text>
            <Text style={[styles.tableCell, styles.currencyCell]}>1</Text>
          </View>

          {/* ✅ 繰越データ */}
          <View style={styles.tableRow}>
            <Text style={[styles.tableCell, styles.dateCell]}>繰越</Text>
            <Text style={[styles.tableCell, styles.typeCell]}></Text>
            <Text style={[styles.tableCell, styles.amountCell]}></Text>
            <Text style={[styles.tableCell, styles.summaryCell]}></Text>
            <Text style={[styles.tableCell, styles.recipientCell]}></Text>
            <Text style={[styles.tableCell, styles.memoCell]}></Text>
            <Text style={[styles.tableCell, styles.balanceCell]}>{formatNumber(previousCarryOver.RunningBalance || 0)}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.TenThousandYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.FiveThousandYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.OneThousandYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.FiveHundredYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.OneHundredYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.FiftyYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.TenYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.FiveYen || 0}</Text>
            <Text style={[styles.tableCell]}>{previousCarryOver.OneYen || 0}</Text>
          </View>

          {/* ✅ 取引データ */}
          {history.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.dateCell]}>{formatDate(item.TransactionDate)}</Text>
              <Text style={[styles.tableCell, styles.typeCell]}>{item.TransactionType}</Text>
              <Text style={[styles.tableCell, styles.amountCell]}>{formatNumber(item.Amount || 0)}</Text>
              <Text style={[styles.tableCell, styles.summaryCell]}>{item.Summary}</Text>
              <Text style={[styles.tableCell, styles.recipientCell]}>{item.Recipient}</Text>
              <Text style={[styles.tableCell, styles.memoCell]}>{item.Memo}</Text>
              <Text style={[styles.tableCell, styles.balanceCell]}>{formatNumber(item.RunningBalance || 0)}</Text>
              <Text style={[styles.tableCell]}>{item.TenThousandYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.FiveThousandYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.OneThousandYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.FiveHundredYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.OneHundredYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.FiftyYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.TenYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.FiveYen || 0}</Text>
              <Text style={[styles.tableCell]}>{item.OneYen || 0}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default CashManagementPDF;
