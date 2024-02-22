import express, { Router } from "express"
import raeController from "../controllers/raeController"

const raeRouter: Router = express.Router()

raeRouter.get("/list", raeController.list);
raeRouter.post("/list", raeController.list);
raeRouter.post(`/filter`, raeController.filter);
raeRouter.post("/create", raeController.create);
raeRouter.delete("/delete/:ids", raeController.delete);


export default raeRouter;