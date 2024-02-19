import express, { Router } from 'express';
import { noticeController } from '../controllers/noticeController';

const noticeRouter: Router = express.Router();

// 공지사항 CRUD
noticeRouter.post('/create', noticeController.createPost); // 생성
noticeRouter.get('/all', noticeController.selectAllPosts); // 조회(전체)
noticeRouter.put('/update/:id', noticeController.updatePosts); // 수정
noticeRouter.delete('/delete/:id', noticeController.deletePosts); // 삭제

export default noticeRouter;
