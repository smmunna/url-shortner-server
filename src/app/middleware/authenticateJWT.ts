import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = "sdkskd2223433kskdkslllsdkdjsmmunna"; // Use environment variables in production

const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Access denied. No token provided." });
    }
    else {
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            (req as any).user = decoded; // Attach decoded user info to request
            next(); // Proceed to the next middleware
        } catch (error) {
            res.status(403).json({ message: "Invalid token" });
        }
    }

};

export default authenticateJWT;
