import express, { Router } from "express"
import productController from "../controllers/productController"

const productRouter: Router = express.Router()

productRouter.get("/list", productController.list);
productRouter.get("/admin/module", productController.adminModule);
productRouter.post("/list", productController.list);
productRouter.post("/relate", productController.relate);
productRouter.post("/filter", productController.filter);
productRouter.post("/create", productController.create);
productRouter.post("/upload", productController.upload);
productRouter.post("/upload/excel", productController.uploadExcel);
productRouter.patch("/edit", productController.edit);
productRouter.put("/categoryEdit", productController.categoryEdit);
productRouter.put("/supplyLow", productController.supplyLow);
productRouter.delete("/delete/:id", productController.delete);


export default productRouter;