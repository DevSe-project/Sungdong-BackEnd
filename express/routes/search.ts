import express, { Router } from "express"
import searchController from "../controllers/searchController"

const searchRouter: Router = express.Router()

searchRouter.get("/list", searchController.list);
searchRouter.post("/list", searchController.list);
searchRouter.post("/admin/list", searchController.adminList);

export default searchRouter;