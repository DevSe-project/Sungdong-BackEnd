"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./routes/auth"));
const cors_1 = __importDefault(require("cors"));
const db_1 = __importDefault(require("./db"));
const app = (0, express_1.default)();
const PORT = 5050;
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.get("/", (req, res) => {
    const connection = db_1.default.getConnection();
    connection.query("SELECT 1", (err, result) => {
        console.log(result);
    });
    res.send({ "msg": "Hello SungDong asdaasdasdsd!" });
});
app.use("/auth", auth_1.default);
app.listen(PORT, () => { console.log(`[SERVER] : http://localhost:${PORT} ON!`); });
