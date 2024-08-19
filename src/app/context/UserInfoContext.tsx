import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';

export type UserPermissions = {
  roleId: string;
  taskId: string;
  taskValue: string;
  enable: boolean;
};

export type UserInfo = {
  id: string | undefined;
  selectedOrganization?: string;
  organizations: string[] | undefined;
  authorities: string[];
  isInternalUser: boolean | undefined;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  email?: string;
  userName?: string;
  userPermissions?: UserPermissions[]; // Integrated userPermissions
};

export const initialState: UserInfo = {
  id: undefined,
  selectedOrganization: undefined,
  authorities: [],
  isInternalUser: undefined,
  organizations: [],
  isActive: false,
  userPermissions: [], // Initialize with an empty array
};

interface UserInfoContextType {
  userInfo: UserInfo;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo>>;
  fetchPermissions: (roleId: string) => void;
}

const UserInfoContext = createContext<UserInfoContextType | undefined>(undefined);
UserInfoContext.displayName = 'UserInfoContext';

export function UserInfoProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [userInfo, setUserInfo] = useState<UserInfo>(initialState);

  const fetchPermissions = async (roleId: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/permissions/role/${roleId}`);
      setUserInfo(prevState => ({
        ...prevState,
        userPermissions: response.data,
      }));
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
    }
  };

  return (
    <UserInfoContext.Provider value={{ userInfo, setUserInfo, fetchPermissions }}>
      {children}
    </UserInfoContext.Provider>
  );
}

export function useUserInfo(): UserInfoContextType {
  const context = useContext(UserInfoContext);
  if (!context) {
    throw new Error('useUserInfo must be used within a UserInfoProvider');
  }
  return context;
}
