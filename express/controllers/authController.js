"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const uuid_1 = require("uuid");
const users = [
    {
        id: "AAA",
        userId: "ptk57581",
        email: "ptk725739@gmail.com"
    }
];
const jwtSecret = 'sung_dong';
const authController = {
    login: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, email } = req.body;
        const user = users.find((u) => u.userId === userId);
        if (!user) {
            return res.status(401).json({ msg: "Invalid id" });
        }
        const emailMatch = email === user.email;
        if (!emailMatch) {
            return res.status(401).json({ msg: "Invalid email" });
        }
        const token = jsonwebtoken_1.default.sign({
            id: user.id,
            userId: user.userId
        }, jwtSecret, { expiresIn: '1h' });
        return res.json({ token });
    }),
    register: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const { reqId, reqEmail } = req.body;
        const uid = (0, uuid_1.v4)();
        console.log(uid);
        const user = {
            id: uid,
            userId: reqId,
            email: reqEmail
        };
        users.push(user);
        return res.status(200).json({ msg: "Register!" });
    })
};
exports.default = authController;
