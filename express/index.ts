import express, { Express, Request, Response } from "express"
import authRouter from "./routes/auth";
import categoryRouter from "./routes/category";
import dlRouter from "./routes/delivery"
import cors from 'cors'
import db from './db'
import cookieParser from 'cookie-parser';
import session from "express-session";

import productRouter from "./routes/product";
import cartRouter from "./routes/cart";
import orderRouter from "./routes/order";
import searchRouter from "./routes/search";
import estimateRouter from "./routes/estimate";
import raeRouter from "./routes/rae";
import noticeRouter from "./routes/notice";
import eventRouter from "./routes/event";
const app: Express = express()
const PORT = 5050;

app.use(cookieParser());
app.use(express.json())
app.use(cors({
  origin: 'https://localhost:3000', // 클라이언트 도메인
  credentials: true, // 쿠키 전달을 허용
}))
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Origin', 'https://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

  next();
});

app.use(session({
  secret: 'sung_dong',
  resave: false,
  saveUninitialized: true,
}));

// 정적 파일 제공을 위한 미들웨어 설정
// 'images' 폴더를 정적 자원으로 제공
app.use(express.static('images'));


app.get("/", (req: Request, res: Response) => {
  const connection = db.getConnection()
  connection.query("SELECT 1", (err, result) => {
    console.log(result)
  })
  res.send({ "msg": "Hello SungDong asdaasdasdsd!" });
  connection.releaseConnection;
});

declare module 'express-session' {
  interface SessionData {
    orderData?: any; // 사용자 정의 세션 속성
  }
}


app.use("/auth", authRouter);
app.use("/category", categoryRouter);
app.use("/delivery", dlRouter);
app.use("/product", productRouter);
app.use("/cart", cartRouter);
app.use("/order", orderRouter);
app.use("/search", searchRouter);
app.use("/estimate", estimateRouter);
app.use("/rae", raeRouter);
app.use("/notice", noticeRouter);
app.use("/event", eventRouter);

app.listen(PORT, () => { console.log(`[SERVER] : http://localhost:${PORT} ON!`) })
