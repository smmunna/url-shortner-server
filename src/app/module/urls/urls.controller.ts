import { NextFunction, Request, Response } from "express";
import { insertOne } from "../../lib/dbQuery";



const createUrls = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url } = req.body;

        if (!url) {
            res.status(404).json({
                message: 'URL is required',
            })
        }
        else {
            const shortCode = Math.random().toString(36).substring(2, 8);;
            const shortenerUrl = `${req.protocol}://${req.get('host')}/` + shortCode;

            // Insert Information into database
            const urlsCollection = {
                url,
                shortenerUrl,
                timestamp: new Date(),
            }

            const result = await insertOne('urls', urlsCollection);
            const clicked = 0;

            res.status(200).json({
                message: `Shortend url has been created successfully`,
                result,
                shortCode,
                clicked
            });
        }


    } catch (error) {
        next(error);
    }
};


export const urlsController = {
    createUrls,
};
