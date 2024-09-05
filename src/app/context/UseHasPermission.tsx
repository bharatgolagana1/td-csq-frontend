import { useEffect, useState } from 'react';
import axios from 'axios';

export type UserPermissions = {
  roleId: string;
  taskId: string;
  taskName: string;
  taskValue: string;
  enable: boolean;
};

export const useHasPermission = (roleName: string): ((permissions: string) => boolean) => {
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [roleId, setRoleId] = useState<string | null>(null);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchRoleId = async () => {
      try {
        const response = await axios.get(`${API_URL}/roles`);
        const roles = response.data;
        const role = roles.find((r: { name: string }) => r.name === roleName);
        if (role) {
          setRoleId(role._id);
        } else {
          console.error(`Role ${roleName} not found`);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      }
    };

    fetchRoleId();
  }, [roleName]);

  useEffect(() => {

    const fetchPermissions = async () => {
      if (!roleId) return;

      try {
        const response = await axios.get(`${API_URL}/permissions/role/${roleId}`);
        setUserPermissions(response.data);
      } catch (error) {
        console.error('Failed to fetch permissions:', error);
      }
    };

    fetchPermissions();
  }, [roleId]);

  const hasPermission = (permissions: string): boolean => {
    return userPermissions.some(permission => 
      permission.taskName === permissions && permission.enable === true
    );
  };

  return hasPermission;
};