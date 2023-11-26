import express, { Router, Request, Response } from "express";
import jwt from 'jsonwebtoken'

const users = [
    {
        id : 1,
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
    }
}

export default authController