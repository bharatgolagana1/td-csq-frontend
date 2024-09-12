import React from 'react';
import { UseUserPermissions } from './UseUserPermissions';

const HasAccess = ({ requiredPermission, children }: { requiredPermission: string, children: React.ReactNode }) => {
  const { userPermissions, loading } = UseUserPermissions();

  if (loading) {
    return <div style={{marginLeft:'1.5rem' , fontSize:'14px'}}>Loading...</div>;
  }

  const hasPermission = userPermissions.some((permission: { taskName: string; enable: any; }) => 
    permission.taskName === requiredPermission && permission.enable
  );

  if (!hasPermission) {
    return <div style={{marginTop:'3rem' , fontSize:'14px', fontWeight:'bold'}}>
      Access Denied please contact admin
      </div>;
  }

  return <>{children}</>;
};

export default HasAccess;