const express = require("express");
// サーバー用のインスタンスを作成
const app = express();

// ルーティングとミドルウェア

// ミドルウェアによる処理の共通化
const logMiddleware = (req, res, next) => {
  console.log(req.method, req.url);
  next(); // ログ出力ミドルウェアが終わったことアプリケーションに伝える
};

// GET '/' (トップ)アクセス時の挙動
app.get(
  "/",
  logMiddleware,
  // 元のミドルウェア
  (req, res) => {
    res.status(200).send("hello world\n");
  }
);

// GET '/user/:id' に一致するGETの挙動
app.get("/user/:id", (req, res) => {
  res.status(200).send(req.params.id);
});

const errorMiddleware = (req, res, next) => {
  next(new Error("ミドルウェアからのエラー"));
};

app.get("/err", errorMiddleware, (req, res) => {
  console.log("errルート");
  res.status(200).send("errルート");
});

// 包括的エラーハンドリング
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Internal Server Error");
});

// ポート：3000でサーバーを起動
app.listen(3000, () => {
  // サーバー起動後に呼び出されるCallback
  console.log("start listening");
});
