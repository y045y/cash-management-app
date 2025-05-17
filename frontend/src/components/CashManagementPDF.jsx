import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

// フォントの登録
Font.register({
  family: "NotoSansJP",
  src: "/fonts/NotoSansJP-Regular.ttf",
});

// スタイル設定
const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: "NotoSansJP",
  },
  title: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
  dateText: {
    fontSize: 12,
    textAlign: "right",
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    marginTop: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
  },
  // セル（左寄せ）
  tableCellLeft: {
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
    paddingLeft: 4,
  },
  // セル（右寄せ）
  tableCellRight: {
    justifyContent: "center",
    alignItems: "flex-end",
    borderRightWidth: 1,
    borderRightColor: "#000",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    height: 30,
    paddingRight: 4,
  },
  // 各列幅
  dateCell: { width: 50 },
  depositCell: { width: 50 },
  withdrawalCell: { width: 50 },
  balanceCell: { width: 70 },
  recipientCell: { width: 100 },
  summaryCell: { width: 110 },
  memoCell: { width: 130 },
  currencyCell: { width: 30 },
});

// データをページ単位に分割
const splitIntoPages = (data, itemsPerPage = 14) => {
  const pages = [];
  for (let i = 0; i < data.length; i += itemsPerPage) {
    pages.push(data.slice(i, i + itemsPerPage));
  }
  return pages;
};

// 長文省略用関数
const truncate = (text, max) =>
  text && text.length > max ? text.slice(0, max - 1) + "…" : text;

// メインコンポーネント
const CashManagementPDF = ({
  history = [],
  previousCarryOver = {},
  currentMonth,
}) => {
  const pages = splitIntoPages(history, 14);

  const formatNumber = (number) =>
    number != null ? new Intl.NumberFormat("ja-JP").format(number) : "0";

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Document>
      {pages.map((pageHistory, pageNumber) => (
        <Page
          key={pageNumber}
          style={styles.page}
          size={{ width: 841.89, height: 595.28 }}
        >
          <Text style={styles.title}>
            金庫管理履歴表 ({currentMonth}月) - {pageNumber + 1}ページ
          </Text>
          <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>

          <View style={styles.table}>
            {/* ヘッダ行 */}
            <View style={styles.tableRow}>
              {[
                "日付",
                "入金",
                "出金",
                "残高",
                "相手",
                "摘要",
                "メモ",
                "万",
                "5千",
                "千",
                "5百",
                "百",
                "5十",
                "十",
                "5",
                "1",
              ].map((label, i) => (
                <View
                  key={i}
                  style={[
                    styles[
                      i < 4 || (i >= 7 && i <= 15)
                        ? "tableCellRight"
                        : "tableCellLeft"
                    ],
                    styles[
                      [
                        "dateCell",
                        "depositCell",
                        "withdrawalCell",
                        "balanceCell",
                        "recipientCell",
                        "summaryCell",
                        "memoCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                        "currencyCell",
                      ][i]
                    ],
                  ]}
                >
                  <Text style={{ fontSize: 10 }}>{label}</Text>
                </View>
              ))}
            </View>

            {/* 繰越行（1ページ目のみ） */}
            {pageNumber === 0 && (
              <View style={styles.tableRow}>
                <View style={[styles.tableCellLeft, styles.dateCell]}>
                  <Text style={{ fontSize: 10 }}>繰越</Text>
                </View>
                <View style={[styles.tableCellRight, styles.depositCell]}>
                  <Text style={{ fontSize: 10 }}></Text>
                </View>
                <View style={[styles.tableCellRight, styles.withdrawalCell]}>
                  <Text style={{ fontSize: 10 }}></Text>
                </View>
                <View style={[styles.tableCellRight, styles.balanceCell]}>
                  <Text style={{ fontSize: 10 }}>
                    {formatNumber(previousCarryOver.RunningBalance || 0)}
                  </Text>
                </View>
                {["recipientCell", "summaryCell", "memoCell"].map((cls, i) => (
                  <View key={i} style={[styles.tableCellLeft, styles[cls]]}>
                    <Text style={{ fontSize: 10 }}></Text>
                  </View>
                ))}
                {[
                  "TenThousandYen",
                  "FiveThousandYen",
                  "OneThousandYen",
                  "FiveHundredYen",
                  "OneHundredYen",
                  "FiftyYen",
                  "TenYen",
                  "FiveYen",
                  "OneYen",
                ].map((key, i) => (
                  <View
                    key={i}
                    style={[styles.tableCellRight, styles.currencyCell]}
                  >
                    <Text style={{ fontSize: 10 }}>
                      {previousCarryOver[key] || 0}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* データ行 */}
            {pageHistory.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCellLeft, styles.dateCell]}>
                  <Text style={{ fontSize: 10 }}>
                    {formatDate(item.TransactionDate)}
                  </Text>
                </View>
                <View style={[styles.tableCellRight, styles.depositCell]}>
                  <Text style={{ fontSize: 10 }}>
                    {item.TransactionType === "入金" ||
                    item.TransactionType === "Deposit"
                      ? formatNumber(item.Amount ?? 0)
                      : ""}
                  </Text>
                </View>
                <View style={[styles.tableCellRight, styles.withdrawalCell]}>
                  <Text style={{ fontSize: 10 }}>
                    {item.TransactionType === "出金" ||
                    item.TransactionType === "Withdrawal"
                      ? formatNumber(item.Amount ?? 0)
                      : ""}
                  </Text>
                </View>
                <View style={[styles.tableCellRight, styles.balanceCell]}>
                  <Text style={{ fontSize: 10 }}>
                    {formatNumber(item.RunningBalance || 0)}
                  </Text>
                </View>
                <View style={[styles.tableCellLeft, styles.recipientCell]}>
                  <Text style={{ fontSize: 10 }} wrap={false}>
                    {item.Recipient}
                  </Text>
                </View>
                <View style={[styles.tableCellLeft, styles.summaryCell]}>
                  <Text style={{ fontSize: 10 }} wrap={false}>
                    {item.Summary}
                  </Text>
                </View>
                <View style={[styles.tableCellLeft, styles.memoCell]}>
                  <Text style={{ fontSize: 10 }} wrap={false}>
                    {truncate(item.Memo, 18)}
                  </Text>
                </View>
                {[
                  "TenThousandYen",
                  "FiveThousandYen",
                  "OneThousandYen",
                  "FiveHundredYen",
                  "OneHundredYen",
                  "FiftyYen",
                  "TenYen",
                  "FiveYen",
                  "OneYen",
                ].map((key, i) => (
                  <View
                    key={i}
                    style={[styles.tableCellRight, styles.currencyCell]}
                  >
                    <Text style={{ fontSize: 10 }}>{item[key] || 0}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default CashManagementPDF;
