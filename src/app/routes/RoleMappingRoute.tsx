import { RouteObject } from "react-router-dom";
import RoleMappingPage from "../pages/RoleMappingPage";

  const RoleMappingRoute: RouteObject[] = [
    {
    path:'role-mapping',
    element : <RoleMappingPage/>
  }
  ];
  
  export default RoleMappingRoute;