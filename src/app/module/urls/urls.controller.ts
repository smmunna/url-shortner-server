import { NextFunction, Request, Response } from "express";


const createUrls = async (req: Request, res: Response, next: NextFunction) =>{
        const { url } = req.body;

}

export const urlsController = {
    createUrls
}