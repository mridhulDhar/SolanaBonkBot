import { Request, Response, NextFunction } from "express";
import jwt  from "jsonwebtoken";

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  user?: any;
}

export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({error: 'Unauthorized access'});
    }

    jwt.verify(token, process.env.JWT_SECRET!, (err: any, user:any) => {
        if(err){
            return res.status(403).json({error: 'expired session'});
        }

        req.userId = user.userId;
        req.userEmail = user.email;
        req.user = user;
        next();
    });
};