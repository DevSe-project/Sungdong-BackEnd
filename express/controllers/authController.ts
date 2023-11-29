import express, { Router, Request, Response } from "express"
import jwt from 'jsonwebtoken'
import { v1, v4 } from 'uuid'
const users = [
    {
        id : "f869c33a-83e1-47c6-a0e5-2947f8992c4f",
        userId : "ptk57581",
        email : "ptk725739@gmail.com"
    }
]

const jwtSecret = 'sung_dong'

const authController = {
    login : async (req : Request, res : Response) => {
        const { userId, email } = req.body        
        const user = users.find((u) => u.userId === userId)
        
        if (!user) {
            return res.status(401).json({msg : "Invalid id"})
        }
        
        const emailMatch = email === user.email

        if (!emailMatch) {
            return res.status(401).json({msg : "Invalid email"})
        }

        const token = jwt.sign({
            id : user.id,
            userId : user.userId
        }, jwtSecret, 
        { expiresIn : '1h' })
        
        return res.json({token})
    },
    register : async (req : Request, res : Response) => {
        const { reqId, reqEmail } = req.body;
        const uid = v4()
        const isFindUser = users.find((user)=>{user.userId === reqId})        
        if (isFindUser) {
            return res.status(400).json({msg : " 이미 존재하는 유저 입니다."})
        }
        const user = {
            id : uid,
            userId : reqId,
            email : reqEmail
        }    
        users.push(user);
        return res.status(200).json({msg : "Register!"})
    }
}

export default authController