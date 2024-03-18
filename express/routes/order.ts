import express, { Router } from "express"
import orderController from "../controllers/orderController"

const orderRouter: Router = express.Router()

orderRouter.get("/list", orderController.list);
orderRouter.get("/all", orderController.orderAll);
orderRouter.get("/rae/list", orderController.raeList);
orderRouter.post("/list", orderController.list);
orderRouter.post("/all", orderController.orderAll);
orderRouter.post("/rae/list", orderController.raeList);
orderRouter.put(`/invoice`, orderController.applyEditedInvoice);
orderRouter.put(`/cancel`, orderController.cancelOrder);
orderRouter.post(`/filter`, orderController.filter);
orderRouter.post(`/rae/filter`, orderController.raeFilter);

orderRouter.put(`/user/cancel`, orderController.requestCancelOrder);

orderRouter.post(`/search`, orderController.search);

//관리자 페이지 모듈(length 출력)
orderRouter.get("/admin/module", orderController.adminModule);

orderRouter.post("/findList", orderController.findList);
orderRouter.post("/findSelectOrderList", orderController.findSelectOrderList);
orderRouter.post("/findSelectOrderProduct", orderController.selectOrderProductById);
orderRouter.post("/write", orderController.write);
orderRouter.get("/findOne", orderController.findOne);
orderRouter.post("/create", orderController.create);
orderRouter.delete("/delete/:ids", orderController.delete);


export default orderRouter;