import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import express, { Request, Response } from "express"
import Event from "../models/event.model";
import multer, { Multer } from "multer";
import path from "path";
import jwt from 'jsonwebtoken'
const jwtSecret = 'sung_dong'

const eventController = {
  create: async (req: Request, res: Response) => {
    const requestData = req.body;
    const newEvent = {
      event_title: requestData.event_title,
      event_content: requestData.event_content,
      event_startDate: requestData.event_startDate,
      event_endDate: requestData.event_endDate,
      eventState: requestData.eventState,
      event_image: requestData.event_image
    };
    Event.create(newEvent, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 생성하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 생성이 완료 되었습니다.', success: true });
      }
    })
  },
  list: async (req: Request, res: Response) => {
    const currentPage = req.query.page || 1;
    const postsPerPage = req.query.post || 10;
    // 데이터베이스에서 불러오기
    Event.list(currentPage, postsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "이벤트 목록을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 이벤트 목록 갱신이 완료 되었습니다.', success: true, data });
      }
    })
  },
  edit: async (req: Request, res: Response) => {
    const requestData = req.body;
    const newEvent = {
      event_title: requestData.event_title,
      event_content: requestData.event_content,
      event_startDate: requestData.event_startDate,
      event_endDate: requestData.event_endDate,
      eventState: requestData.eventState,
      event_image: requestData.event_image
    };
    // 업데이트된 데이터로 데이터베이스 업데이트
    Event.edit(newEvent, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 갱신이 완료 되었습니다.', success: true, data });
      }
    })
  },

  filter: async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string) || 1;
    const postsPerPage = parseInt(req.query.post as string) || 10;
    const requestData = req.body;
    const newFilter = {
      eventState: requestData.state || '',
      dateType: requestData.dateType,
      dateStart: requestData.date.start,
      dateEnd: requestData.date.end
    }
    Event.filter(newFilter,currentPage,postsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 조회가 완료 되었습니다.', success: true, data });
      }
    })
  },

  delete: async (req: Request, res: Response) => {
    const requestData = req.params.id;
    Event.deleteByIds(requestData, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "상품을 갱신하는 중 서버 오류가 발생했습니다." });
      else {
        return res.status(200).json({ message: '성공적으로 상품 삭제가 완료 되었습니다.', success: true, data });
      }
    })
  },
  upload: async (req: Request, res: Response) => {
    console.log('이미지 업로드 요청 받음');
    // 이미지 업로드를 위한 multer 설정
    const storage = multer.diskStorage({
      destination: 'images/event', // 이미지를 저장할 폴더
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
        const imageUrl = `http://localhost:5050/event/${req.file.filename}`;
        const fileName = req.file.filename;
        console.log(imageUrl);
        return res.json({ imageUrl, fileName });
      }
    });
  }
}

export default eventController