import express, { Router } from "express"
import productController from "../controllers/productController"

const productRouter: Router = express.Router()

productRouter.get("/list", productController.list);
productRouter.post("/list", productController.list);
productRouter.post("/create", productController.create);
productRouter.post("/upload", productController.upload);
productRouter.patch("/edit", productController.edit);
productRouter.put("/categoryEdit", productController.categoryEdit);
productRouter.put("/supplyLow", productController.supplyLow);
productRouter.delete("/delete/:id", productController.delete);


export default productRouter;