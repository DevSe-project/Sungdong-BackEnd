import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Product from "../models/product.model";
import multer, { Multer } from "multer";
import path from "path";

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
          product_image_original: requestData.product_image_original,
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
    Product.create(newProduct, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if(err)
        return res.status(500).send({ message: err.message || "상품을 생성하는 중 서버 오류가 발생했습니다." });
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
        product_image_original: requestData.product_image_original,
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
  },
  categoryEdit : async (req : Request, res : Response) => {
    const requestData = req.body;
    // 데이터베이스에서 불러오기
    const newData = {
            product1: {
              product_id: requestData.product_id,
              category_id: requestData.category_id,
              parentsCategory_id: requestData.parentsCategory_id,
            },
            product2: {
              product_id : requestData.product_id,
              category_id: requestData.category_id,
              parentsCategory_id: requestData.parentsCategory_id,
            },
        };
    Product.edit(newData, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
        }
    })
  },
  supplyLow : async (req : Request, res : Response) => {
    const requestData = req.body.map((item: {
      cart_cnt: string;
      product_id: any; 
      product_supply: string; 
    }) => ({
      product_id: item.product_id,
      product_supply: parseInt(item.product_supply) - parseInt(item.cart_cnt)
    }));
    Product.lowSupply(requestData)
    .then((result) => {
      console.log('모든 상품의 재고가 재설정 되었습니다:', result);
      return res.status(200).json({ message: '성공적으로 상품 재고 변경이 완료 되었습니다.', success: true});
    })
    .catch((error) => {
      console.error('상품의 재고를 업데이트하는 중 오류가 발생했습니다:', error);
      return res.status(500).send({ message: error || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
    });
  },
  delete : async (req : Request, res : Response) => {
    const requestData = req.params.id;
    Product.deleteByIds(requestData, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
        }
    })
  },
  upload : async (req : Request, res : Response) => {
      console.log('이미지 업로드 요청 받음');
    // 이미지 업로드를 위한 multer 설정
    const storage = multer.diskStorage({
      destination: 'images/', // 이미지를 저장할 폴더
      filename: (req, file, cb) => {
      // 파일명 중복을 피하기 위해 고유한 파일명 생성
      cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
      },
    });

    const upload: Multer = multer({ storage: storage });
    upload.single('image')(req, res, (err) => {
      if (err) {
          return res.status(400).json({ error: '이미지를 업로드하지 못했습니다.' });
      }
      if (req.file) {
          const imageUrl = `http://localhost:5050/${req.file.filename}`;
          const fileName = req.file.filename;
          console.log(imageUrl);
          return res.json({ imageUrl, fileName });
      }      
    });
  }
}

export default productController