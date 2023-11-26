import express, { Express, Request, Response } from "express"
const app : Express = express()
const PORT = 5050;
app.get("/", (req : Request, res : Response)=>{
    res.send({"msg" : "Hello SungDong asdaasdasdsd!"});    
});
app.listen(PORT, ()=>{ console.log(`[SERVER] : http://localhost:${PORT} ON!`) })