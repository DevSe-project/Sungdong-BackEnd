import express, { Router } from "express"
import estimateController from "../controllers/estimateController"

const estimateRouter: Router = express.Router()

estimateRouter.get("/list", estimateController.list);
estimateRouter.get("/manager", estimateController.manager);
estimateRouter.post("/list", estimateController.list);
estimateRouter.post("/findList", estimateController.findList);
estimateRouter.post("/create", estimateController.create);
estimateRouter.post("/initBox", estimateController.initBox);
estimateRouter.delete("/delete/:ids", estimateController.delete);


export default estimateRouter;