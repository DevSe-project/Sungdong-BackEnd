import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { NextFunction, Request, Response } from "express"
import Order from "../models/order.model";
import multer, { Multer } from "multer";
import path from "path";
import jwt from 'jsonwebtoken'
import User from "../models/users.model";

const jwtSecret = 'sung_dong'


const orderController = { 
  write: (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({msg : "token null"})
    }
    try {
      const requestData = req.body;
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;

      const userData = req.user;

      User.findAllUserInfo(userData, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        if (err) {
            return res.status(500).send({ message: err });
        } else {
          req.session.orderData = requestData;
          res.status(200).json({ success: true, message: '해당 상품들로 주문서 작성을 시작합니다.', requestData, data });
        }
      });
    } catch (error) {
      return res.status(500).json({ message: '장바구니에서 주문 작성으로 데이터를 넘기지 못했습니다.' });
    }
  }, 
  read: (req: Request, res: Response) => {
    try {
      const orderData = req.session.orderData || {};
      res.status(200).json({ success: true, message: '주문서 정보를 다시 불러왔습니다.', orderData });
    } catch (error) {
      return res.status(500).json({ message: '장바구니에서 주문 작성으로 데이터를 넘기지 못했습니다.' });
    }
  }, 
  create: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
      if (!token) {
        return res.status(401).json({message : "로그인 후 사용 가능합니다."})
      }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.body;
      const today = new Date();
      const formattedDate = new Intl.DateTimeFormat('en-Us', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(today);
      const [month, day, year] = formattedDate.split('/');
      const rearrangedDate = `${year}-${month}-${day}`;


  // 중복 체크를 위해 데이터베이스에서 검색
  Order.findOne([req.user.users_id, requestData.product_id, requestData.category_id, requestData.selectedOption], (err: QueryError | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
    if (err) {
        // 서버 오류가 발생한 경우
        return res.status(500).send({ message: err || "서버 오류가 발생했습니다." });
    }

    // 데이터베이스에서 중복된 상품이 검색되면
    if (data) {
        return res.status(400).json({ message: "이미 존재하는 상품입니다.", success: false });
    } else {
      const newProduct = {
        product1: {
          cart_updated: rearrangedDate,
        },
        product2: {
          product_id : requestData.product_id,
          category_id: requestData.category_id,
          parentsCategory_id: requestData.parentsCategory_id,
          cart_price: requestData.product_price,
          cart_discount: requestData.product_discount,
          cart_cnt: requestData.cnt,
          cart_amount: (requestData.product_price - ((requestData.product_price / 100) * requestData.product_discount)) * requestData.cnt,
          cart_selectedOption : requestData.selectedOption
        },
    };
    Order.create([newProduct, req.user.users_id], (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if(err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 생성이 완료 되었습니다.', success: true });
      }
    })
    }})
  } catch (error) {
    return res.status(403).json({ message: '회원 인증이 만료되었거나 로그인이 필요합니다.' });
  }
  },  
  list : async (req : Request, res : Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
    if (!token) {
        return res.status(401).json({msg : "token null"})
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
    // 데이터베이스에서 불러오기
    Order.list(requestData.users_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
        }
    })
  } catch (error) {
    return res.status(403).json({ message: '인증이 만료되었거나 로그인이 필요합니다.' });
  }
  },
  delete : async (req : Request, res : Response) => {
    const productIds = req.params.ids.split(',').map(Number);
    Order.deleteByIds(productIds, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
        }
    })
  }
}

export default orderController;