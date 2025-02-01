import { NextFunction, Request, Response } from "express";



const createUrls = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url } = req.body;

        const shortCode = Math.random().toString(36).substring(2, 8);;
        const shortenerUrl =`${req.protocol}://${req.host}/${shortCode}`;

        res.json({
            message: `URL "${url}" has been created successfully`,
            shortenedUrl: shortenerUrl,
            shortCode: shortCode,
        });
    } catch (error) {
        next(error);
    }
};


export const urlsController = {
    createUrls,
};
