import { Request, Response } from "express";
import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import Notice from "../models/notice.model";

export const noticeController = {
  createPost: async (req: Request, res: Response) => {
    if (!req.body) {
      res.status(400).send({
        message: '내용을 채워주세요!'
      })
    }
    const newPost = {
      
    }
  }
}