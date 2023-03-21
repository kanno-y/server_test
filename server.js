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
app.get("/user/:id", async (req, res) => {
  try {
    const key = `users:${req.params.id}`;
    const val = await redis.get(key);
    const user = JSON.parse(val);
    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("internal error");
  }
});

app.get("/users", async (req, res) => {
  try {
    const stream = redis.scanStream({
      match: "users:*",
      count: 2, // 1回のy鼻出しで２つ取り出す
    });
    const users = [];
    for await (const resultkeys of stream) {
      for (const key of resultkeys) {
        const value = await redis.get(key);
        const user = JSON.parse(value);
        users.push(user);
      }
    }
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("internal error");
  }
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
