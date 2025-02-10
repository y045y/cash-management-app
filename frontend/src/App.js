import React from "react";
import CashManagementFormUI from "./components/CashManagementFormUI";
// import CashStateTable from "@components/CashStateTable";




import './App.css';
import "bootstrap/dist/css/bootstrap.min.css"; // Bootstrap を読み込む

function App() {
  return (
    <div className="container">
      <CashManagementFormUI />
      {/* <CashStateTable/>  */}
    </div>
  );
}

export default App;
