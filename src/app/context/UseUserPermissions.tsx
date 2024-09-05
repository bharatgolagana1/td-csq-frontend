import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUserInfo } from './UserInfoContext';

export type UserPermissions = {
  roleId: string;
  taskId: string;
  taskName: string;
  taskValue: string;
  enable: boolean;
};

export const UseUserPermissions = () => {
  const { userInfo } = useUserInfo();
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchPermissions = async () => {
      if (userInfo?.role) {
        try {
          // Fetch role ID based on userInfo.role
          const roleResponse = await axios.get(`${API_URL}/roles`);
          const roles = roleResponse.data;
          const role = roles.find((r: { name: string }) => r.name === userInfo.role);
          
          if (role) {
            const roleId = role._id;
            // Fetch permissions based on roleId
            const permissionsResponse = await axios.get(`${API_URL}/permissions/role/${roleId}`);
            setUserPermissions(permissionsResponse.data);
          } else {
            console.error(`Role ${userInfo.role} not found`);
          }
        } catch (error) {
          console.error('Failed to fetch permissions:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [userInfo]);

  return { userPermissions, loading };
};