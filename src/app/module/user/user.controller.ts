import { NextFunction, Request, Response } from "express";
import { findOne, insertOne } from "../../lib/dbQuery";
import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = "sdkskd2223433kskdkslllsdkdjsmmunna";

const userSchema = z.object({
    name: z.string().min(4, 'Name at least 4 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(4, 'Password at least 4 characters'),
    role: z.string(),
    status: z.string(),
    verified: z.boolean()
})
// Creating a new user account
const createUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userInfo = userSchema.parse(req.body);
        // Hash the password
        const hashedPassword = await bcrypt.hash(userInfo.password, 10);
        // Replace plain password with hashed password
        userInfo.password = hashedPassword;
        // Check if user exists
        const user = await findOne("users", { email: userInfo.email });

        if (user) {
            res.status(400).json({ message: "User already exists" });
        }
        else {
            if (userInfo) {
                const result = await insertOne('users', userInfo)
                res.status(200).json({
                    message: 'User registration successful',
                    result
                });
            }
            else {
                res.status(400).json({
                    message: 'User information is required',
                });
            }
        }
    } catch (error) {
        // Handle Zod validation errors
        if (error instanceof z.ZodError) {
            res.status(400).json({
                message: "Validation failed",
                errors: error.errors.map(err => ({
                    field: err.path.join("."),
                    message: err.message
                }))
            });
        }
        else {
            next(error);
        }
    }
}

// Sign in user
const signInUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await findOne("users", { email });

        if (!user) {
            res.status(400).json({ message: "Invalid email or password" });
        }

        else {
            // Compare entered password with hashed password
            const isMatch = await bcrypt.compare(password, user.password);

            if (!isMatch) {
                res.status(400).json({ message: "Invalid email or password" });
            }

            else {
                // ✅ Generate JWT Token
                const token = jwt.sign(
                    { id: user.id, email: user.email }, // Payload
                    JWT_SECRET, // Secret Key
                    { expiresIn: "1h" } // Token Expiry
                );

                res.status(200).json({
                    message: "Login successful",
                    token,
                    user: { id: user._id, name: user.name, email: user.email }
                });
            }

        }


    } catch (error) {
        next(error);
    }
};

export const userController = {
    createUser,
    signInUser,
}