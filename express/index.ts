import express, { Express, Request, Response } from "express"
import authRouter from "./routes/auth";

const app : Express = express()
const PORT = 5050;

app.use(express.json())

app.get("/", (req : Request, res : Response)=>{
    res.send({"msg" : "Hello SungDong asdaasdasdsd!"});    
});

app.use("/auth", authRouter)

app.listen(PORT, ()=>{ console.log(`[SERVER] : http://localhost:${PORT} ON!`) })