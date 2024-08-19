import { useEffect, useState } from 'react';
import { useUserInfo } from '../../context/UserInfoContext';
import { useHasPermission } from '../../context/useHasPermission';
import './HomePageComponent.css';

const HomePageComponent = () => {
  const { userInfo } = useUserInfo(); 
  const hasPermission = useHasPermission();
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  useEffect(() => {
    const permissions = userInfo.userPermissions?.filter(permission => permission.enable).map(permission => permission.taskValue);
    setUserPermissions(permissions || []);
  }, [userInfo]);

  return (
    <div className='home-page'>
      <h1>
        Welcome home! User, click on the menu icon to navigate.
      </h1>
      <div className='permissions'>
        <h2>Your Permissions:</h2>
        {userPermissions.length > 0 ? (
          <ul>
            {userPermissions.map((permission, index) => (
              <li key={index}>{permission}</li>
            ))}
          </ul>
        ) : (
          <p>You have no permissions assigned.</p>
        )}
      </div>

      
      {hasPermission('manage user') && (
        <div>
          <p>You have permission to perform a specific action!</p>
          
        </div>
      )}
    </div>
  );
};

export default HomePageComponent;
