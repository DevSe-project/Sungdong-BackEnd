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
const User = require("../models/users.model.js");

const jwtSecret = 'sung_dong';
const authController = {
    login: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const loadUser = req.body;
        User.login(loadUser, (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.json({ success: false, message: "아이디나 패스워드를 다시 확인해주세요!"});
                } else {
                    console.error(err);
                    res.status(500).json({ success: false, message: "서버 오류 발생" });
                }
        }
        else {
            if (data) {
                req.session.user = data;
                res.json({ success: true, message: "로그인 되었습니다."});
                }
                else {
                res.json({ success: false, message: "아이디 및 비밀번호를 확인해주세요!"})
                }
            }
    })
    const token = jsonwebtoken_1.default.sign({
        id: loadUser.id,
        userId: loadUser.userId
    }, jwtSecret, { expiresIn: '1h' });
    return res.json({ token });
    }),
    register: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        if(!req.body){
            res.status(400).send({
                message: "내용을 채워주세요!"
            });
        };

        const user = new User({
            email: req.body.email,
            name: req.body.name,
            userId: req.body.userId,
            userPassword: req.body.userPassword,
        });

        // 데이터베이스에 저장
        User.create(user, (err, data) =>{
            if(err){
                res.status(500).send({
                    message:
                    err.message || "유저 정보를 갱신하는 중 서버 오류가 발생했습니다."
                });
            } else {
            res.send({message: '성공적으로 회원가입이 완료되었습니다.', success: true});
            }
        })
        return res.status(200).json({ msg: "Register!" });
    }),
    user: (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ msg: "token null" });
        }
        jsonwebtoken_1.default.verify(token, jwtSecret, (err, user) => {
            if (err) {
                return res.status(403).json({ msg: "Invalid Token" });
            }
            return res.status(200).json({ user: user });
        });
    })
}
const _default = authController;
module.exports = _default;
