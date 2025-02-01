import { NextFunction, Request, Response } from "express";
import { insertOne, findOne, updateOne, paginate } from "../../lib/dbQuery";



const createUrls = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { url, email } = req.body;

        if (!url) {
            res.status(404).json({
                message: 'URL is required',
            })
        }
        else {
            const shortCode = Math.random().toString(36).substring(2, 8);;
            const shortenerUrl = `${req.protocol}://${req.get('host')}/` + shortCode;
            const clicked = 0;

            // Insert Information into database
            const urlsCollection = {
                url,
                shortenerUrl,
                email,
                clicked,
                timestamp: new Date(),
            }

            const result = await insertOne('urls', urlsCollection);

            res.status(200).json({
                message: `Shortend url has been created successfully`,
                result
            });
        }
    } catch (error) {
        next(error);
    }
};

const redirectUrl = async (req: Request, res: Response, next: NextFunction) => {
    const { url, email } = req.query
    try {
        const result = await findOne('urls', { shortenerUrl: url }, { timestamp: 0, id: 0, shortenerUrl: 0 });
        if (result) {
            // Increment click count
            const updatedClicks = (result.clicked || 0) + 1;
            await updateOne('urls', { shortenerUrl: url }, { clicked: updatedClicks })
            res.json({
                message: 'Urls fetched successfully',
                result,
                email,
                timestamp: new Date()
            })
        }
    }
    catch (error) {
        next(error)
    }
}

const myShortendUrl = async (req: Request, res: Response, next: NextFunction) => {
    const { email, page, limit } = req.query
    try {
        const result = await paginate('urls', { email: email }, {}, { page: Number(page) || 1, limit: Number(limit) || 10, sortField: 'timestamp', sortOrder: 'desc' });
        res.json({
            message: 'Urls fetched successfully',
            result
        })
    } catch (error) {
        next(error)
    }
}

export const urlsController = {
    createUrls,
    redirectUrl,
    myShortendUrl,
};
