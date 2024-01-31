import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { NextFunction, Request, Response } from "express"
import Order from "../models/order.model";
import jwt from 'jsonwebtoken'
import User from "../models/users.model";
import shortid from "shortid";
import Product from "../models/product.model";
const jwtSecret = 'sung_dong'


const orderController = {
  write: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }
    try {
      const requestData = req.body;
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;

      const userData = req.user;

      const newProduct = requestData.map((item: any) => ({
        ...item,
        product_id: item.product_id,
        category_id: item.category_id,
        parentsCategory_id: item.parentsCategory_id,
        cart_price: item.cart_price || item.product_price,
        cart_discount: item.cart_discount || item.product_discount,
        cart_cnt: item.cart_cnt || item.cnt,
        cart_selectedOption: item.cart_selectedOption || item.selectedOption
      }));
      try{
        const checkedSupply = await Product.checkedSupply(newProduct);
        if(checkedSupply) {
          User.findAllUserInfo(userData, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
            if (err) {
              return res.status(500).send({ message: err });
            } else {
              req.session.orderData = newProduct;
              res.status(200).json({ success: true, message: '해당 상품들로 주문서 작성을 시작합니다.', newProduct, data });
            }
          });
        }
      } catch(error: any) {
        return res.status(400).json({ message: error.message });
      }
    } catch (error) {
      return res.status(403).json({ message: '회원인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },
  create: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 사용 가능합니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.body;
      const newId = shortid();
      const orderListMap = requestData.orderList.map((item: {
        cart_discount: number;
        cart_price: any;
        cart_cnt: any;
        cart_selectedOption: string;
        cart_amount: string;
        category_id: string;
        parentsCategory_id: string;
        product_id: string;
      }) => ({
        order_id: newId,
        users_id: req.user.users_id,
        product_id: item.product_id,
        parentsCategory_id: item.parentsCategory_id,
        category_id: item.category_id,
        order_cnt: item.cart_cnt,
        order_productPrice: item.cart_price * item.cart_cnt - (((item.cart_price/100)*item.cart_discount)*item.cart_cnt),
        selectedOption: item.cart_selectedOption
      }))
      const newProduct = {
        product1: {
          order_id: newId,
          users_id: req.user.users_id,
          userType_id: req.user.userType_id,
          ...(({ address, checked, isCart, ...restOrderInfo } = requestData.orderInformation) => restOrderInfo)(),
          zonecode: requestData.orderInformation.address.zonecode,
          roadAddress: requestData.orderInformation.address.roadAddress,
          bname: requestData.orderInformation.address.bname,
          buildingName: requestData.orderInformation.address.buildingName,
          jibunAddress: requestData.orderInformation.jibunAddress ? requestData.orderInformation.jibunAddress : '',
          order_payAmount: requestData.orderList.reduce((sum: number, item: { cart_price: number; cart_cnt: number; cart_discount: number; }) => //reduce 함수사용하여 배열 객체의 합계 계산, delivery값으로 sum을 초기화
            sum + ((item.cart_price * item.cart_cnt) - ((item.cart_price / 100) * item.cart_discount) * item.cart_cnt)
            , 3000),
          orderState: 1
        },
        product2: orderListMap,
        product3: {
          order_id: newId,
          users_id: req.user.users_id,
          ...requestData.deliveryInformation,
        },
      };
      Order.create([newProduct, newId], (err: { message: any; }) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문이 완료 되었습니다.', success: true });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '회원 인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },
  list: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
      // 데이터베이스에서 불러오기
      Order.list(requestData.users_id, (err: { message: any; }, data: any[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          const groupedData: any[] = [];
          data?.forEach((item: {
            delivery_num: any;
            delivery_selectedCor: string;
            deliveryType: string;
            delivery_date: Date;
            product_spec: string;
            order_id: any;
            users_id: string;
            order_date: Date;
            orderState: number;
            order_productPrice: string;
            selectedOption: string;
            order_cnt: number;
            product_title: string;
            product_image_original: any;
          }) => {
            const orderId = item.order_id;

            if (!groupedData[orderId]) {
              groupedData[orderId] = {
                order_id: orderId,
                users_id: item.users_id,
                order_date: item.order_date,
                orderState: item.orderState,
                delivery_date: item.delivery_date,
                deliveryType: item.deliveryType,
                delivery_selectedCor: item.delivery_selectedCor,
                delivery_num: item.delivery_num,
                products: [],
              };
            }

            groupedData[orderId].products.push({
              order_productPrice: item.order_productPrice,
              selectedOption: item.selectedOption,
              order_cnt: item.order_cnt,
              product_title: item.product_title,
              product_spec: item.product_spec,
              product_image_original: item.product_image_original,
            });
          });

          const result = Object.values(groupedData);
          return res.status(200).json({ message: '성공적으로 주문 상품 갱신이 완료 되었습니다.', success: true, result });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },
  findList: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
      // 데이터베이스에서 불러오기
      Order.findList(requestData.users_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '회원 인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },
  findSelectOrderList: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
      // 데이터베이스에서 불러오기
      Order.findSelectOrderList(requestData.users_id, req.body.order_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "주문 내역을 갱신 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문 내역을 불러왔습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '회원 인증이 만료되어 로그인이 필요합니다.' });
    }
  },
  findOne: async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
      const orderData = req.session.orderData
      // 데이터베이스에서 불러오기
      Order.findOne(requestData.users_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문내역을 불러왔습니다.', success: true, data, orderData });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '인증이 만료되어 로그인이 필요합니다.' });
    }
  },
  delete: async (req: Request, res: Response) => {
    const productIds = req.params.ids.split(',').map(Number);
    Order.deleteByIds(productIds, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
      }
    })
  }
}

export default orderController;