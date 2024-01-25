// 라우팅: 클라이언트의 요청에 적절한 컨트롤러를 연결해주는 것
import express, { Router } from 'express';
import deliveryController from '../controllers/deliveryController';

const dlRouter : Router = express.Router();

/* --------------------배송 조회-------------------- */
dlRouter.get("/dlAll", deliveryController.deliveryAll);


export default dlRouter;