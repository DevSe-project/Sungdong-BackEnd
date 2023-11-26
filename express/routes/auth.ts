import express, { Router } from "express"
import authController from "../controllers/authController";

const authRouter : Router = express.Router()

authRouter.post("/login", authController.login);

export default authRouter