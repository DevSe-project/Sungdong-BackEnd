import express, { Router } from "express"
import authController from "../controllers/authController";

const authRouter : Router = express.Router()

authRouter.post("/login", authController.login);
authRouter.post("/register", authController.register);
authRouter.get("/user", authController.user);

export default authRouter