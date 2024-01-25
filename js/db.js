"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = __importDefault(require("mysql2"));
const database_1 = __importDefault(require("./config/database.js"));
const connection = mysql_1.default.createConnection(database_1.default);
connection.connect((err) => {
    if (err) {
        console.error(err);
        console.error("데이터베이스 커넥션 error");
        return;
    }
    console.log("데이터베이스 커넥팅 완료!");
});
const getConnection = () => connection;
const closeConnection = () => {
    connection.end((err) => {
        if (err) {
            return console.error("데이터베이스 커넥션 close error");
        }
        console.log("데이터베이스 커넥션 close");
    });
};
const _default = {
    getConnection,
    closeConnection
};
module.exports = _default;