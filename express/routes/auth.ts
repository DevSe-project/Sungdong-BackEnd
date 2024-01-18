import express, { Router } from "express"
import authController from "../controllers/authController";
import jwtMiddleware from "../middleware/jwtMiddleware";

const authRouter : Router = express.Router()

authRouter.post("/login", authController.login);
authRouter.post("/findId", authController.findId);
authRouter.post("/logout", authController.logout);
authRouter.post("/register", authController.register);
authRouter.get("/user", jwtMiddleware, authController.user);

export default authRouter;