import React from 'react';
import { useUserPermissions } from './useUserPermissions';

const HasAccess = ({ requiredPermission, children }: { requiredPermission: string, children: React.ReactNode }) => {
  const { userPermissions, loading } = useUserPermissions();

  if (loading) {
    return <div style={{marginLeft:'1.5rem' , fontSize:'14px'}}>Loading...</div>;
  }

  const hasPermission = userPermissions.some(permission => 
    permission.taskName === requiredPermission && permission.enable
  );

  if (!hasPermission) {
    return <div style={{marginLeft:'1.5rem' , fontSize:'14px'}}>Access Denied</div>;
  }

  return <>{children}</>;
};

export default HasAccess;
