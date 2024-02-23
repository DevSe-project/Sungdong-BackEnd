import express, { Router } from "express"
import raeController from "../controllers/raeController"

const raeRouter: Router = express.Router()

raeRouter.get("/list", raeController.list);
raeRouter.post("/list", raeController.list);
raeRouter.get("/admin/list", raeController.adminList);
raeRouter.post("/admin/list", raeController.adminList);
raeRouter.post(`/admin/filter`, raeController.filter);
raeRouter.post("/admin/find/product", raeController.selectOrderProductById);
raeRouter.post("/admin/find/products", raeController.selectOrderProductByIds);
raeRouter.post("/create", raeController.create);
raeRouter.delete("/delete/:ids", raeController.delete);


export default raeRouter;