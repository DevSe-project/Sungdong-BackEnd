import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import { Request, Response } from "express"
import Search from "../models/search.model";
import multer, { Multer } from "multer";
import path from "path";

const searchController = { 
  list : async (req : Request, res : Response) => {
    const currentPage = req.query.page || 1;
    const postsPerPage = req.query.post || 5;
    const requestData = req.body;

    let searchTerm;

    if (Array.isArray(requestData) && requestData.length > 0) {
      searchTerm = [{
          product_id: requestData[0]?.product_id || '',
          product_title: requestData[0]?.product_title || '',
          product_brand: requestData[0]?.product_brand || '',
          product_spec: requestData[0]?.product_spec || '',
          product_model: requestData[0]?.product_model || '',
      }];
    } else {
      searchTerm = {
        product_id: requestData.search || '',
        product_title: requestData.search || '',
        product_brand: requestData.search || '',
        product_spec: requestData.search || '',
        product_model: requestData.search || '',
      }
    }
    Search.list(searchTerm, currentPage, postsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) =>{
        // 클라이언트에서 보낸 JSON 데이터를 받음
        if(err)
          return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
        else {
          return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
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

export default searchController