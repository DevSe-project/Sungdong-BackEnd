import express, { Express, Request, Response } from "express"
import authRouter from "./routes/auth";
import cors from 'cors'

const app : Express = express()
const PORT = 5050;

app.use(express.json())
app.use(cors())


app.get("/", (req : Request, res : Response)=>{
    res.send({"msg" : "Hello SungDong asdaasdasdsd!"});    
});

app.use("/auth", authRouter)

app.listen(PORT, ()=>{ console.log(`[SERVER] : http://localhost:${PORT} ON!`) })