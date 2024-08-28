import { useUserPermissions } from '../../context/useUserPermissions';

const HomePageComponent = () => {
  const { userPermissions, loading } = useUserPermissions();

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div className='home-page'>
      <h1>Welcome home! User, click on the menu icon to navigate.</h1>

      <div>
        <h2>Your Permissions:</h2>
        {userPermissions.length > 0 ? (
          <ul>
            {userPermissions.map(permission => (
              <li key={permission.taskId}>
                {permission.taskName}: {permission.enable ? 'Enabled' : 'Disabled'}
              </li>
            ))}
          </ul>
        ) : (
          <p>No permissions found.</p>
        )}
      </div>
    </div>
  );
};

export default HomePageComponent;
