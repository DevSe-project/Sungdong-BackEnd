import express, { Router } from "express"
import cartController from "../controllers/cartController"

const cartRouter : Router = express.Router()

cartRouter.get("/list", cartController.list);
cartRouter.post("/create", cartController.create);


export default cartRouter;