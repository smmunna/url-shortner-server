import { Router } from "express";
import { urlsRoutes } from "../module/urls/urls.route";

const router = Router();

const moduleRoutes = [
    {
        path:"/urls",
        route: urlsRoutes
    }
]

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;