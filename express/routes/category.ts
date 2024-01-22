import express, { Router } from "express"
import categoryController from "../controllers/categoryController"

const categoryRouter : Router = express.Router()

categoryRouter.get("/list", categoryController.list);
categoryRouter.post("/create", categoryController.create);


export default categoryRouter;