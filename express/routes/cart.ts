import express, { Router } from "express"
import cartController from "../controllers/cartController"

const cartRouter : Router = express.Router()

cartRouter.get("/list", cartController.list);
cartRouter.post("/list", cartController.list);
cartRouter.post("/create", cartController.create);
cartRouter.delete("/delete/:ids", cartController.delete);


export default cartRouter;