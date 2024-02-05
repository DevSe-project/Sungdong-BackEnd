import express, { Router } from "express"
import authController from "../controllers/authController";
import jwtMiddleware from "../middleware/jwtMiddleware";

const authRouter : Router = express.Router()

// 회원 가입, 로그인, 로그아웃
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/register", authController.register);
authRouter.post("/duplicate", authController.isDuplicateById);
// 아이디 - 비번 찾기
authRouter.post("/findId", authController.findId);
authRouter.post("/findPw", authController.findPw);
// 마이페이지
authRouter.get("/info", authController.info);

/*------------------ 회원 관리--------------------*/
authRouter.get("/userAll", authController.userAll);
authRouter.post("/userFilter", authController.userFilter);
authRouter.post("/userSort", authController.userSort);
authRouter.post("/userDelete", authController.userDel);

/*------------------ 코드 관련--------------------*/
authRouter.get("/codeAll", authController.getAllCode);
authRouter.post("/generateCode", authController.generateCode);
authRouter.post("/checkCode", authController.checkCode);

/*-------------------JWT 검증--------------------*/
authRouter.get("/user", jwtMiddleware, authController.user);

export default authRouter;