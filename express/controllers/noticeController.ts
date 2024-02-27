import { QueryError, RowDataPacket, ResultSetHeader, FieldPacket, ProcedureCallPacket, PoolConnection, OkPacket } from 'mysql2';
import { Request, Response } from "express";
import Notice from "../models/notice.model";
import jwt from 'jsonwebtoken';
const jwtSecret = 'sung_dong';

export const noticeController = {
  createPost: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token) {
      return res.status(401).json({ message: "로그인 후 이용가능한 서비스입니다." });
    }
    if (!req.body.content) {
      return res.status(400).send({
        message: '내용을 채워주세요!'
      });
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      const userData = req.user;

      const newPost = {
        users_id: userData.users_id,
        title: req.body.title,
        content: req.body.content,
        date: req.body.date,
        writer: req.body.writer,
      };

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

  /* ------------------작성자 정보------------------ */


  /**
   * User Token에서 users_id를 통해 users_info테이블의 name 컬럼의 정보를 가져옵니다.
   * @param req 
   * @param res 
   */
  verifiedWriter: async (req: Request, res: Response) => {
    const token = req.cookies.jwt_token;
    if (!token)
      return res.status(401).json({ message: '로그인 후 이용가능한 서비스입니다.' });

    jwt.verify(token, jwtSecret, (err: any, user: any) => {
      if (err) {
        return res.status(403).json({ message: "재 로그인이 필요합니다." })
      }
      else {
        Notice.getLoginUserInfo(user, (err: QueryError | string | null, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
          if (err) {
            return res.status(500).send({ message: err });
          } else {
            return res.status(200).json({ message: '로그인 정보 호출이 완료되었습니다.', success: true, data });
          }
        });
      }
    })
  },


};
