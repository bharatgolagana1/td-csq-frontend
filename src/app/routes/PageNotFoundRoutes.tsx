import { RouteObject } from "react-router-dom";
import PageNotFoundPage from "../pages/PageNotFoundPage";
const PageNotFoundRoutes: RouteObject[] = [{

    path : "*",
    element : <PageNotFoundPage/>
}]

export default PageNotFoundRoutes;
