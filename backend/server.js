require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const connectDB = require("./config/db");
const routes = require("./routes/api");

const app = express();
const PORT = process.env.PORT || 5000;

// ミドルウェア
app.use(cors());
app.use(bodyParser.json());
app.use("/api", routes);

// Reactのビルド済みファイル提供
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) =>
  res.sendFile(path.join(__dirname, "build", "index.html"))
);

// DB接続＆サーバー起動
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 サーバー起動: http://localhost:${PORT}`);
  });
});
