// import React from "react";
// import TransactionHistory from "./components/TransactionHistory";
// import CashStateTable from "./components/CashStateTable";
import CashMamagementFormUI from "./components/CashManagementFormUI"



function App() {
  return (
    <div className="container">
      <h3 className="mt-4" style={{ textAlign: "center" }}>金庫管理システム</h3>
      <CashMamagementFormUI />
    </div>
  );
}


export default App;
