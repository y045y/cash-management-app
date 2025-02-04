import React from "react";
import CashManagementFormUI from "./components/CashManagementFormUI";
import './App.css';
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap を読み込む

function App() {
  return (
    <div className="container">
      <h3 className="mt-4" style={{ textAlign: "center" }}>金庫管理システム</h3>
      <CashManagementFormUI />
    </div>
  );
}

export default App;
