import React from "react";
// import TransactionHistory from "./components/TransactionHistory";
import CashStateTable from "./components/CashStateTable";

function App() {
  return (
    <div className="container">
      <h1 className="mt-4">金庫管理システム</h1>
      <CashStateTable />
      {/* <TransactionHistory /> */}
    </div>
  );
}

export default App;
