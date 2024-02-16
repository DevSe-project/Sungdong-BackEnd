import express, { Router } from 'express';
import { noticeController } from '../controllers/noticeController';

const noticeRouter: Router = express.Router();

// 공지사항 CRUD
noticeRouter.post('/create', noticeController.createPost); // 생성
noticeRouter.get('/all', noticeController.allPost); // 조회(전체)
noticeRouter.put('/edit/:id', noticeController.editPost); // 수정
noticeRouter.delete('/delete/:id', noticeController.deletePost); // 삭제

export default noticeRouter;
