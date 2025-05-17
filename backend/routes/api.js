const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transactionController");
const upload = require("../middleware/upload");

// 各APIルート
router.get("/transaction-history", transactionController.getTransactionHistory);
router.post("/insert-transaction", transactionController.insertTransaction);
router.get("/current-inventory", transactionController.getCurrentInventory);
router.get("/calculate-carryover", transactionController.calculateCarryover);
router.put("/transactions/:id", transactionController.updateTransactionBasic);
router.delete("/transactions/:id", transactionController.deleteTransaction);
router.put(
  "/update-transaction-and-denomination/:id",
  transactionController.updateTransactionWithDenomination
);
router.get("/export-denominations", transactionController.exportDenominations);
router.post(
  "/import-csv",
  upload.single("file"),
  transactionController.importCsv
);

module.exports = router;
