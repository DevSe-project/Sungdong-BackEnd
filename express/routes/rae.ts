import express, { Router } from "express"
import raeController from "../controllers/raeController"

const raeRouter: Router = express.Router()

//유저 반품-교환 조회
raeRouter.get("/list", raeController.list);
raeRouter.post("/list", raeController.list);

//---------- 관리자 ----------

//관리자 페이지 모듈(length 출력)
raeRouter.get("/admin/module", raeController.adminModule);

//관리자 반품-교환 조회
raeRouter.get("/admin/list", raeController.adminList);
raeRouter.post("/admin/list", raeController.adminList);

//관리자 필터
raeRouter.post(`/admin/filter`, raeController.filter);

//관리자 상품 찾기
raeRouter.post("/admin/find/product", raeController.selectOrderProductById); //단일 
raeRouter.post("/admin/find/products", raeController.selectOrderProductByIds); //다중

//관리자 상태 변경
raeRouter.patch("/admin/edit", raeController.changeStatusbyId); //처리상태 변경
raeRouter.patch("/admin/cancel", raeController.changeCancelbyId); //처리상태 변경


//---------- 유저 -----------
//생성
raeRouter.post("/create", raeController.create);
//생성
raeRouter.post("/filter", raeController.raeFilter);
//삭제
raeRouter.delete("/delete/:ids", raeController.delete);


export default raeRouter;