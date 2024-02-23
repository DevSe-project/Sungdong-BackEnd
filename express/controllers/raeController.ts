import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Rae from "../models/rae.model";
import jwt from 'jsonwebtoken'
import shortid from "shortid";
const jwtSecret = 'sung_dong'


const postsPerPage = 5;

const RaeController = {
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
      const raeListMap = requestData.map((item: {
        order_id: any;
        order_product_id: any;
        name: any;
        reason: any;
        returnStatus: any;
        barcodeStatus: any;
        wrapStatus: any;
        productStatus: any;
        rae_amount: number;
        rae_count: number;
        category_id: string;
        parentsCategory_id: string;
        product_id: string;
      }) => ({
        rae_id: newId,
        users_id: req.user.users_id,
        order_product_id: item.order_product_id,
        order_id: item.order_id,
        rae_product_cnt: item.rae_count,
        rae_product_amount: item.rae_amount,
        wrapStatus: item.wrapStatus,
        productStatus: item.productStatus,
        barcodeStatus: item.barcodeStatus,
        rae_returnDel: item.returnStatus,
        rae_reason: item.reason,
        rae_writter: item.name
      }))

      const changedRaeStatus = requestData.map((item: {
        order_product_id: any;
      }) => (
        item.order_product_id
      ))
      const newProduct = {
        product1: {
          rae_id: newId,
          users_id: req.user.users_id,
          userType_id: req.user.userType_id,
          rae_payAmount: requestData.reduce((sum: number, item: {
            rae_amount: number;
          }) => //reduce 함수사용하여 배열 객체의 합계 계산
            sum + item.rae_amount
            , 3000),
          raeState: 1,
        },
        product2: raeListMap,
      };
      Rae.create(newProduct, changedRaeStatus, (err: { message: any; }) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 반품/교환 신청이 완료 되었습니다.', success: true });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '회원 인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },
  list: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    // 요청에서 페이지 번호 가져오기 (기본값은 1)
    const currentPage = req.query.page || 1;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded; // decoded에는 토큰의 내용이 들어 있음
      const requestData = req.user;
      // 데이터베이스에서 불러오기
      Rae.list(requestData.users_id, currentPage, postsPerPage, (err: { message: any; }, data: any | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문 상품 갱신이 완료 되었습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },

  adminList: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    // 요청에서 페이지 번호 가져오기 (기본값은 1)
    const currentPage = req.query.page || 1;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." })
    }

    try {
      // 데이터베이스에서 불러오기
      Rae.adminList(currentPage, postsPerPage, (err: { message: any; }, data: any | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문 상품 갱신이 완료 되었습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(403).json({ message: '인증이 만료되어 재 로그인이 필요합니다.' });
    }
  },

  selectOrderProductById: async (req: Request, res: Response) => {
    try {
      // 데이터베이스에서 불러오기
      Rae.selectProductById(req.body.rae_id, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "주문 내역을 갱신 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문 내역을 불러왔습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(500).json({ message: '예기치 못한 오류가 발생했습니다.' });
    }
  },

  selectOrderProductByIds: async (req: Request, res: Response) => {
    try {
      // 데이터베이스에서 불러오기
      Rae.selectProductById(req.body, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if (err)
          return res.status(500).send({ message: err.message || "주문 내역을 갱신 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 주문 내역을 불러왔습니다.', success: true, data });
        }
      })
    } catch (error) {
      return res.status(500).json({ message: '예기치 못한 오류가 발생했습니다.' });
    }
  },

  filter: async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const postsPerPage = parseInt(req.query.post as string) || 10;
    const requestData = req.body;
    const newFilter = {
      selectFilter: requestData.selectFilter || '',
      filterValue: requestData.filterValue || '',
      deliveryType: requestData.deliveryType || '',
      dateStart: requestData.date.start,
      dateEnd: requestData.date.end
    }
    Rae.filter(newFilter, currentPage, postsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "주문을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 주문 조회가 완료 되었습니다.', success: true, data });
      }
    })
  },

  delete: async (req: Request, res: Response) => {
    const productIds = req.params.ids.split(',').map(Number);
    Rae.deleteByIds(productIds, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
      }
    })
  }
}

export default RaeController;