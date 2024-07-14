import { RouteObject, createBrowserRouter } from "react-router-dom";
import UserTypeMasterRoutes from "./UserTypeMasterRoutes";
import RegistrationRoute from "./RegistrationRoute";
import AirportCargoMasterRoutes from "./AirportCargoMasterRoutes";
import AirportDataMasterRoutes from "./AirportDataMasterRoutes";

const routes: RouteObject[] = [
    ...UserTypeMasterRoutes,
    ...RegistrationRoute,
    ...AirportCargoMasterRoutes,
    ...AirportDataMasterRoutes,
    // add other routes here
  ];
  
  const router = createBrowserRouter(routes);

  export default router;
