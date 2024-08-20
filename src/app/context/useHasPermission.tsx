import { useUserInfo } from './UserInfoContext';

export const useHasPermission = (): ((permissions: string) => boolean) => {
  const { userInfo } = useUserInfo();

  const hasPermission = (permissions: string): boolean => {
    if (userInfo.userPermissions) {
      const currentPermission = userInfo.userPermissions.filter(_permission => {
        return (
          _permission.taskValue === permissions && _permission.enable === true
        );
      });
      return currentPermission.length > 0;
    }
    return false;
  };

  return hasPermission;
};
