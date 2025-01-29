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
    padding: 10,
    fontFamily: 'NotoSansJP',
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 5,
  },
  table: {
    display: 'table',
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderCollapse: 'collapse',
    marginTop: 5,
  },
  tableRow: {
    flexDirection: 'row',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
  },
  tableCell: {
    padding: 2,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#000',
    fontSize: 12,
  },
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
  },
  emptyCell: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  dateCell: { width: '6%' },
  typeCell: { width: '8%' },
  amountCell: { width: '8%' },
  descriptionCell: { width: '10%' },
  recipientCell: { width: '10%' },
  memoCellWidth: { width: '18%' },
  totalAmountCell: { width: '8%' },
  differenceCell: { width: '8%' },
  currencyCell: { width: '5%' },
  header: {
    backgroundColor: '#ddd',
    fontWeight: 'bold',
  },
  dateTopRight: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 5,
  },
});

// PDF コンポーネント
const CashManagementPDF = ({ history = [], previousCarryOver = {}, currentMonth }) => {
  const formatNumber = (number) => (number != null ? new Intl.NumberFormat('ja-JP').format(number) : '0');

  const currentDate = new Date().toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const sortedHistory = [...history].sort((a, b) => new Date(a.TransactionDate) - new Date(b.TransactionDate));

  return (
    <Document>
      <Page style={styles.page} size={{ width: 841.89, height: 595.28 }}>
        <Text style={styles.title}>金庫管理レポート ({currentMonth}月)</Text>
        <Text style={styles.dateTopRight}>{`作成日: ${currentDate}`}</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.header]}>
            <Text style={[styles.tableCell, styles.dateCell, styles.textLeft]}>日付</Text>
            <Text style={[styles.tableCell, styles.typeCell, styles.textLeft]}>処理</Text>
            <Text style={[styles.tableCell, styles.amountCell, styles.textRight]}>金額</Text>
            <Text style={[styles.tableCell, styles.descriptionCell, styles.textLeft]}>摘要</Text>
            <Text style={[styles.tableCell, styles.recipientCell, styles.textLeft]}>相手</Text>
            <Text style={[styles.tableCell, styles.memoCellWidth, styles.textLeft]}>メモ</Text>
            <Text style={[styles.tableCell, styles.totalAmountCell, styles.textRight]}>合計金額</Text>
            <Text style={[styles.tableCell, styles.differenceCell, styles.textRight]}>差額</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>万</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>5千</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>千</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>5百</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>百</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>5十</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>十</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>5</Text>
            <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>1</Text>
          </View>

          {previousCarryOver && (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.dateCell, styles.textLeft]}>繰越</Text>
              <Text style={[styles.tableCell, styles.typeCell, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.amountCell, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.descriptionCell, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.recipientCell, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.memoCellWidth, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.totalAmountCell, styles.textRight]}>
                {formatNumber(previousCarryOver.TotalAmount)}
              </Text>
              <Text style={[styles.tableCell, styles.differenceCell, styles.emptyCell]}></Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.TenThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.FiveThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.OneThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.FiveHundredYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.OneHundredYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.FiftyYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.TenYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.FiveYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{previousCarryOver.OneYen || 0}</Text>
            </View>
          )}

          {sortedHistory.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.dateCell, styles.textLeft]}>
                {new Date(item.TransactionDate).toLocaleDateString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                })}
              </Text>
              <Text style={[styles.tableCell, styles.typeCell, styles.textLeft]}>{item.TransactionType}</Text>
              <Text style={[styles.tableCell, styles.amountCell, styles.textRight]}>{formatNumber(item.Amount)}</Text>
              <Text style={[styles.tableCell, styles.descriptionCell, styles.textLeft]}>{item.Description}</Text>
              <Text style={[styles.tableCell, styles.recipientCell, styles.textLeft]}>{item.Recipient}</Text>
              <Text style={[styles.tableCell, styles.memoCellWidth, styles.textLeft]}>{item.Memo}</Text>
              <Text style={[styles.tableCell, styles.totalAmountCell, styles.textRight]}>
                {formatNumber(item.TotalAmount)}
              </Text>
              <Text style={[styles.tableCell, styles.differenceCell, styles.textRight]}>
                {formatNumber(item.TotalBalance)}
              </Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.TenThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.FiveThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.OneThousandYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.FiveHundredYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.OneHundredYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.FiftyYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.TenYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.FiveYen || 0}</Text>
              <Text style={[styles.tableCell, styles.currencyCell, styles.textRight]}>{item.OneYen || 0}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default CashManagementPDF;
