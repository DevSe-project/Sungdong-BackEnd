import express, { Router } from "express"
import authController from "../controllers/authController";
import jwtMiddleware from "../middleware/jwtMiddleware";

const authRouter : Router = express.Router()

authRouter.post("/login", authController.login);
authRouter.post("/findId", authController.findId);
authRouter.post("/findPw", authController.findPw);
authRouter.post("/logout", authController.logout);
authRouter.post("/register", authController.register);
authRouter.get("/info", authController.info);
authRouter.get("/userAll", authController.userAll);
authRouter.get("/user", jwtMiddleware, authController.user);

export default authRouter;