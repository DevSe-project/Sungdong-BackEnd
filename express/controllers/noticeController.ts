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
    if (!req.body) {
      return res.status(400).send({
        message: '내용을 채워주세요!'
      });
    }

    const currentDate = new Date();
    const formattedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()} ${currentDate.getHours()}:${currentDate.getMinutes()}:${currentDate.getSeconds()}`;

    try {
      // token을 jwtSecret키를 통해 
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;

      const newPost = {
        users_id: req.user.users_id,
        post_title: req.body.title,
        post_writer: req.body.writer,
        post_content: req.body.contents,
        post_date: formattedDate
      };

      const result = await Notice.create(newPost);
      return res.status(201).send({ message: '게시물이 성공적으로 작성되었습니다.', result });
    } catch (error: any) {
      if (error.code === 'ER_DATA_TOO_LONG') {
        return res.status(400).send({ message: '데이터 용량을 초과하였습니다,.' });
      }
      console.error(error);
      return res.status(500).send({
        message: '내부 서버 오류 발생'
      });
    }
  },


  /**
   * 전달받은 페이지와 페이지 당 포스팅 개수에 맞춰 posts를 반환합니다.
   * @param req token, page, pagePosts
   * @param res 
   */
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
  /**
   * postId에 맞는 post 반환
   * @param req 수정할 post의 postId
   * @param res 전달받은 postId와 매치되는 post를 반환
   */
  selectMatchedPost: async (req: Request, res: Response) => {
    const postId = req.body.postId;
    Notice.selectMatchedPost(postId, (err: { message: any; }, data: ResultSetHeader | RowDataPacket | RowDataPacket[] | null) => {
      if (err)
        return res.status(500).send({ message: err.message || "해당하는 포스트를 찾는 데 실피했습니다." });
      else
        return res.status(200).json({ message: '해당하는 공지사항 정보 호출이 성공적으로 완료되었습니다.', success: true, data });
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
    const postId = parseInt(req.params.id, 10);

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
