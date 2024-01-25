import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Product from "../models/product.model";

const productController = {
  create: async (req: Request, res: Response) => {
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
          product_id: requestData.product_id,
          category_id: requestData.category_id,
          parentsCategory_id: requestData.parentsCategory_id,
          product_title: requestData.product_title,
          product_content: requestData.product_content,
          product_price: requestData.product_price,
          product_discount: requestData.product_discount,
          product_updated: rearrangedDate,
          product_created: rearrangedDate,
          product_supply: requestData.product_supply,
          product_brand: requestData.product_brand,
          product_madeIn: requestData.product_madeIn,
          product_state: requestData.product_state,
          product_spec: requestData.product_spec
        },
        product2: {
          product_id : requestData.product_id,
          category_id: requestData.category_id,
          parentsCategory_id: requestData.parentsCategory_id,
          ...requestData.option
        },
    };
    Product.create(newProduct, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if(err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 생성이 완료 되었습니다.', success: true });
      }
    })
  },  
  list : async (req : Request, res : Response) => {
    // 데이터베이스에서 불러오기
    Product.list((err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
        }
    })
  },
  edit : async (req : Request, res : Response) => {
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
        product_id: requestData.product_id,
        category_id: requestData.category_id,
        parentsCategory_id: requestData.parentsCategory_id,
        product_title: requestData.product_title,
        product_content: requestData.product_content,
        product_price: requestData.product_price,
        product_discount: requestData.product_discount,
        product_updated: rearrangedDate,
        product_supply: requestData.product_supply,
        product_brand: requestData.product_brand,
        product_madeIn: requestData.product_madeIn,
        product_state: requestData.product_state,
        product_spec: requestData.product_spec
      },
      product2: {
        product_id : requestData.product_id,
        category_id: requestData.category_id,
        parentsCategory_id: requestData.parentsCategory_id,
        ...requestData.option
      },
  };
  // 업데이트된 데이터로 데이터베이스 업데이트
  Product.edit(newProduct, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
    // 클라이언트에서 보낸 JSON 데이터를 받음
    if(err)
      return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
    else {
      return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
    }
    })
  }
}

export default productController