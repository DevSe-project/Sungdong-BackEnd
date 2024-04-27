import express, { Router } from "express"
import authController from "../controllers/authController";
import jwtMiddleware from "../middleware/jwtMiddleware";

const authRouter: Router = express.Router()

/*------------------ 회원가입/로그인/로그아웃 --------------------*/
authRouter.post("/login", authController.login);
authRouter.post("/logout", authController.logout);
authRouter.post("/register", authController.register);
authRouter.post("/duplicate", authController.isDuplicateById);

/*------------------ 로그인: ID/PW 찾기 --------------------*/
authRouter.post("/findId", authController.findId);
authRouter.post("/findPw", authController.findPw);

/*------------------ 마이페이지 --------------------*/
authRouter.get("/info", authController.info);
authRouter.post("/mypage/password", authController.pwUpdate);

/*------------------ WelcomeModule --------------------*/
authRouter.get("/welcomeInfo", authController.welcomeInfo);

/*------------------ 회원 관리 --------------------*/
authRouter.get("/read/:id", authController.readUser); // 조회
authRouter.post("/filtering/:id", authController.userFilter); // 필터링
authRouter.post("/sorting/:id", authController.userSort); // 정렬
authRouter.post("/update", authController.userUpdate); // 업데이트(수정)
authRouter.delete("/delete/:ids", authController.userDel); // 삭제
authRouter.post("/upload", authController.upload);

/*------------------ 코드 관련 --------------------*/
authRouter.get("/codeAll", authController.getAllCode);
authRouter.post("/generateCode", authController.generateCode);
authRouter.post("/checkCode", authController.checkCode);

/*------------------- JWT 검증 --------------------*/
authRouter.get("/user", jwtMiddleware, authController.user);
authRouter.post("/verify/admin", authController.verifyAdmin);

export default authRouter;