import express, { Router } from "express"
import eventController from "../controllers/eventController"

const eventRouter: Router = express.Router()

eventRouter.get("/list", eventController.list);
eventRouter.post("/list", eventController.list);
eventRouter.post("/filter", eventController.filter);
eventRouter.post("/create", eventController.create);
eventRouter.post("/upload", eventController.upload);
eventRouter.patch("/edit", eventController.edit);
eventRouter.delete("/delete/:id", eventController.delete);


export default eventRouter;