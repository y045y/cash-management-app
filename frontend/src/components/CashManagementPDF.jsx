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
  dateText: {
    fontSize: 12,
    textAlign: 'right',
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderRightWidth: 1,
    borderRightColor: '#000',
    height: 30,
    alignItems: 'center',
  },
  tableCellLeft: {
    padding: 4,
    fontSize: 10,
    textAlign: 'left',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  tableCellRight: {
    padding: 4,
    fontSize: 10,
    textAlign: 'right',
    borderRightWidth: 1,
    borderRightColor: '#000',
  },
  dateCell: { width: 50 },
  depositCell: { width: 50 },
  withdrawalCell: { width: 50 },
  balanceCell: { width: 70 },
  recipientCell: { width: 100 },
  summaryCell: { width: 110 },
  memoCell: { width: 130 },
  currencyCell: { width: 30 },
});

const splitIntoPages = (data, itemsPerPage = 14) => {
  const pages = [];
  for (let i = 0; i < data.length; i += itemsPerPage) {
    pages.push(data.slice(i, i + itemsPerPage));
  }
  return pages;
};

const CashManagementPDF = ({ history = [], previousCarryOver = {}, currentMonth }) => {
  const pages = splitIntoPages(history, 14);
  const formatNumber = (number) => (number != null ? new Intl.NumberFormat('ja-JP').format(number) : '0');
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };
  return (
    <Document>
      {pages.map((pageHistory, pageNumber) => (
        <Page key={pageNumber} style={styles.page} size={{ width: 841.89, height: 595.28 }}>
          <Text style={styles.title}>金庫管理履歴表 ({currentMonth}月) - {pageNumber + 1}ページ</Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
  
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCellLeft, styles.dateCell]}>日付</Text>
              <Text style={[styles.tableCellRight, styles.depositCell]}>入金</Text>
              <Text style={[styles.tableCellRight, styles.withdrawalCell]}>出金</Text>
              <Text style={[styles.tableCellRight, styles.balanceCell]}>残高</Text>
              <Text style={[styles.tableCellLeft, styles.recipientCell]}>相手</Text>
              <Text style={[styles.tableCellLeft, styles.summaryCell]}>摘要</Text>
              <Text style={[styles.tableCellLeft, styles.memoCell]}>メモ</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>万</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>5千</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>千</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>5百</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>百</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>5十</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>十</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>5</Text>
              <Text style={[styles.tableCellRight, styles.currencyCell]}>1</Text>
            </View>
  
            {/* ✅ 1ページ目だけ繰越金を表示 */}
            {pageNumber === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCellLeft, styles.dateCell]}>繰越</Text>
                <Text style={[styles.tableCellRight, styles.depositCell]}></Text>
                <Text style={[styles.tableCellRight, styles.withdrawalCell]}></Text>
                <Text style={[styles.tableCellRight, styles.balanceCell]}>{formatNumber(previousCarryOver.RunningBalance || 0)}</Text>
                <Text style={[styles.tableCellLeft, styles.recipientCell]}></Text>
                <Text style={[styles.tableCellLeft, styles.summaryCell]}></Text>
                <Text style={[styles.tableCellLeft, styles.memoCell]}></Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.TenThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.FiveThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.OneThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.FiveHundredYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.OneHundredYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.FiftyYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.TenYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.FiveYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{previousCarryOver.OneYen || 0}</Text>
              </View>
            )}
  
            {pageHistory.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCellLeft, styles.dateCell]}>{formatDate(item.TransactionDate)}</Text>
                <Text style={[styles.tableCellRight, styles.depositCell]}>
                  {(item.TransactionType === "入金" || item.TransactionType === "Deposit") ? formatNumber(item.Amount ?? 0) : ""}
                </Text>
                <Text style={[styles.tableCellRight, styles.withdrawalCell]}>
                  {(item.TransactionType === "出金" || item.TransactionType === "Withdrawal") ? formatNumber(item.Amount ?? 0) : ""}
                </Text>
                <Text style={[styles.tableCellRight, styles.balanceCell]}>{formatNumber(item.RunningBalance || 0)}</Text>
                <Text style={[styles.tableCellLeft, styles.recipientCell]}>{item.Recipient}</Text>
                <Text style={[styles.tableCellLeft, styles.summaryCell]}>{item.Summary}</Text>
                <Text style={[styles.tableCellLeft, styles.memoCell]}>{item.Memo}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.TenThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.FiveThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.OneThousandYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.FiveHundredYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.OneHundredYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.FiftyYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.TenYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.FiveYen || 0}</Text>
                <Text style={[styles.tableCellRight, styles.currencyCell]}>{item.OneYen || 0}</Text>
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
  
  
};

export default CashManagementPDF;
