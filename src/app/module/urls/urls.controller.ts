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
            const shortenerUrl = `${req.protocol}://${req.get('host')}/api/v1/urls/` + shortCode;
            const clicked = 0;

            // Insert Information into database
            const urlsCollection = {
                url,
                shortenerUrl,
                shortCode,
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
    const shortCode = req.params.shortCode;
    try {
        const result = await findOne('urls', { shortCode: shortCode });
        if (result) {
            // Increment click count
            const updatedClicks = (result.clicked || 0) + 1;
            await updateOne('urls', { shortCode: shortCode }, { clicked: updatedClicks })

            return res.redirect(301, result.url);
        } else {
            res.status(404).json({
                message: 'Shortened URL not found',
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
