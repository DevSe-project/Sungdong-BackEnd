import express, { Router } from 'express';
import { noticeController } from '../controllers/noticeController';

const noticeRouter: Router = express.Router();

// 공지사항 CRUD
noticeRouter.post('/create', noticeController.createPost); // 생성
noticeRouter.get('/read', noticeController.selectPosts); // 조회(전체)
noticeRouter.put('/update/:id', noticeController.updatePosts); // 수정
noticeRouter.delete('/delete/:id', noticeController.deletePosts); // 삭제

// 로그인 사용자 정보 호출
noticeRouter.post('/login/info', noticeController.verifiedWriter);

export default noticeRouter;
