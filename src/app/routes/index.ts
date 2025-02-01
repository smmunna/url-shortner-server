import { Router } from "express";
import { urlsRoutes } from "../module/urls/urls.route";
import { userRoutes } from "../module/user/user.route";

const router = Router();

const moduleRoutes = [
    {
        path:"/urls",
        route: urlsRoutes
    },
    {
        path:"/users",
        route: userRoutes
    }
]

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;