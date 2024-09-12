import { RouteObject } from "react-router-dom";
import UserMasterPage from "../pages/UserMaster/UserMasterPage";
import UserMasterForm from "../features/userMaster/components/userMasterForm/UserMasterForm";

export const UserMasterRoute:RouteObject[] = [
    {
        path : '/user-master',
        element : <UserMasterPage/>
    },
    {
        path : '/user-master/add-user',
        element : <UserMasterForm/>
    }
]