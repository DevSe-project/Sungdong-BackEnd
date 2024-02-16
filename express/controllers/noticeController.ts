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
      content: req.body.content,
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
  allPost: async (req: Request, res: Response) => {
    try {
      const result = await Notice.getAll();
      return res.status(200).send(result);
    } catch (error) {
      console.error(error);
      return res.status(500).send({
        message: '내부 서버 오류 발생'
      });
    }
  },
  editPost: async (req: Request, res: Response) => {
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
  deletePost: async (req: Request, res: Response) => {
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
