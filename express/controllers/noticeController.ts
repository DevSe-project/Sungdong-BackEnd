import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, ProcedureCallPacket, PoolConnection, OkPacket } from 'mysql2';
import { Request, Response } from "express";
import Notice from "../models/notice.model";

export const noticeController = {
  createPost: async (req: Request, res: Response) => {
    if (!req.body.content) {
      return res.status(400).send({
        message: '내용을 채워주세요!'
      });
    }
    const newPost = {
      title: req.body.title,
      content: req.body.content,
      date: req.body.date,
      writer: req.body.writer,
    };

    try {
      const result = await Notice.create(newPost);
      return res.status(201).send(result);
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: '내부 서버 오류 발생'
      });
    }
  },
  selectPosts: async (req: Request, res: Response) => {
    const currentPage = parseInt(req.query.page as string, 10) || 1;
    const itemsPerPage = parseInt(req.query.pagePosts as string, 10) || 10;
    Notice.selectAllToPageNumber(currentPage, itemsPerPage, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      // 클라이언트에서 보낸 JSON 데이터를 받음
      if (err)
        return res.status(500).send({ message: err.message || "공지사항을 갱신하는 중 서버 오류가 발생했 습니다." });
      else {
        return res.status(200).json({ message: '공지사항이 성공적으로 갱신이 완료 되었습니다.', success: true, data });
      }
    })
  },
  updatePosts: async (req: Request, res: Response) => {
    const postId = req.params.id;
    const updatedContent = req.body.content;

    if (!updatedContent) {
      return res.status(400).send({
        message: '내용을 채워주세요!'
      });
    }

    try {
      const result = await Notice.update(postId, updatedContent);
      if (result.affectedRows === 0) {
        return res.status(404).send({
          message: '게시물을 찾을 수 없습니다.'
        });
      }
      return res.status(200).send({
        message: '수정되었습니다.'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: '내부 서버 오류 발생'
      });
    }
  },
  deletePosts: async (req: Request, res: Response) => {
    const postId = req.params.id;

    try {
      const result = await Notice.delete(postId);
      if (result.affectedRows === 0) {
        return res.status(404).send({
          message: '게시물을 찾을 수 없습니다.'
        });
      }
      return res.status(200).send({
        message: '삭제되었습니다.'
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: '내부 서버 오류 발생'
      });
    }
  },
};
