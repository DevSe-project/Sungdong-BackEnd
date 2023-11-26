"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = 5050;
app.get("/", (req, res) => {
    res.send({ "msg": "Hello SungDong asdaasdasdsd!" });
});
app.listen(PORT, () => { console.log(`[SERVER] : http://localhost:${PORT} ON!`); });
