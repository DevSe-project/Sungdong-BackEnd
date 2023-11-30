import {Request, Response, NextFunction} from 'express'
import jwt from 'jsonwebtoken'

const jwtSecret = 'sung_dong'
declare global {
    namespace Express {
        interface Request {
            user : any
        }
    }
}
const jwtMiddleware = (req : Request, res : Response, next : NextFunction) => {
    const token = req.header('Authorization')
    if (!token) {
        return res.status(401).json({message : "토큰을 발급 받아 주세요"})
    }
    jwt.verify(token, jwtSecret, (err, user)=>{
        if (err) {
            return res.status(419).json({message : "토큰이 만료되었습니다."})
        }
        req.user = user
        next()
    })
    
}
export default jwtMiddleware