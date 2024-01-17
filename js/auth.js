"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authController_1 = __importDefault(require("../controllers/authController"));
const jwtMiddleware_1 = __importDefault(require("../middleware/jwtMiddleware"));
const authRouter = express_1.default.Router();
authRouter.post("/login", authController_1.default.login);
authRouter.post("/register", authController_1.default.register);
authRouter.get("/user", jwtMiddleware_1.default, authController_1.default.user);
module.exports = () => authRouter;