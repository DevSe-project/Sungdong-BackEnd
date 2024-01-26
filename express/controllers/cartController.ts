import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { NextFunction, Request, Response } from "express"
import Cart from "../models/cart.model";
import multer, { Multer } from "multer";
import path from "path";
import jwt from 'jsonwebtoken'

const jwtSecret = 'sung_dong'


const cartController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
      if (!token) {
          return res.status(401).json({msg : "token null"})
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
    Cart.create([newProduct, req.user.users_id], (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if(err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 생성이 완료 되었습니다.', success: true });
      }
    })
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
    Cart.list(requestData.users_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
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
    const requestData = req.params.id;
    Cart.deleteByIds(requestData, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
        }
    })
  }
}

export default cartController;