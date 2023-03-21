const Redis = require("ioredis");
const express = require("express");
// サーバー用のインスタンスを作成
const app = express();

const redis = new Redis({
  port: 6379,
  host: "localhost",
  password: process.env.REDIS_PASSWORD,
  // enableOfflineQueue: false,
});

// Redisに初期データをセットする
const init = async () => {
  // Promise.allで同時にセットする
  await Promise.all([
    redis.set("users:1", JSON.stringify({ id: 1, name: "alpha" })),
    redis.set("users:2", JSON.stringify({ id: 2, name: "bravo" })),
    redis.set("users:3", JSON.stringify({ id: 3, name: "charlie" })),
    redis.set("users:4", JSON.stringify({ id: 4, name: "delta" })),
  ]);
};

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

redis.once("ready", async () => {
  try {
    await init(); // initを実行

    // ポート：3000でサーバーを起動
    app.listen(3000, () => {
      // サーバー起動後に呼び出されるCallback
      console.log("start listening");
    });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
});

redis.on("error", (err) => {
  console.error(err);
  process.exit(1);
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
