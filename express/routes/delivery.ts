// 라우팅: 클라이언트의 요청에 적절한 컨트롤러를 연결해주는 것
import express, { Router } from 'express';
import deliveryController from '../controllers/deliveryController';

const dlRouter: Router = express.Router();

/* --------------------배송 조회-------------------- */
dlRouter.get(`/all`, deliveryController.deliveryAll);
/* ---------------배송상태 변경사항 적용--------------- */
dlRouter.put(`/state/edit`, deliveryController.applyEditedState);
dlRouter.put(`/invoice/edit`, deliveryController.applyEditedInvoice);
dlRouter.delete(`/deliveries/cancellation/:ids`, deliveryController.delete);
dlRouter.post(`/filter`, deliveryController.filter);
dlRouter.get("/admin/module", deliveryController.adminModule);



export default dlRouter;