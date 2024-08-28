import React, { useEffect, useState } from 'react';
import { CircularProgress, Button, Snackbar, Alert } from '@mui/material';
import {
  getRoles,
  getModules,
  getTasks,
  getAllPermissions,
  updatePermissions,
} from './API/RolesApi';
import AddTaskDialog from './components/add-task-dialog/AddTaskDialog';
import RoleActions from './components/role-actions/RoleActions';
import RoleTable from './components/role-table/RoleTable';
import { Role, Module, Task, Permission } from './RoleTypes';

const RoleMapping: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [alertOpen, setAlertOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, modulesData, tasksData, permissionsData] = await Promise.all([
          getRoles(),
          getModules(),
          getTasks(),
          getAllPermissions(),
        ]);
        setRoles(rolesData.data);
        setModules(modulesData.data);
        setTasks(tasksData.data);
        setPermissions(permissionsData.data);
      } catch (error) {
        console.error('Failed to fetch data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCheckBox = (roleId: string, taskId: string): void => {
    setPermissions((prevPermissions) => {
      const updatedPermissions = [...prevPermissions];
      const permissionIndex = updatedPermissions.findIndex(
        (perm) => perm.roleId === roleId && perm.taskId === taskId
      );

      if (permissionIndex !== -1) {
        // Toggle the enable state
        updatedPermissions[permissionIndex].enable = !updatedPermissions[permissionIndex].enable;
      } else {
        updatedPermissions.push({
          roleId,
          taskId,
          enable: true,
        } as Permission);
      }

      return updatedPermissions;
    });
  };

  const handleSaveChanges = async (): Promise<void> => {
    try {
      const permissionsToSave = permissions.map(({ roleId, taskId, enable }) => ({
        roleId,
        taskId,
        enable,
      }));

      await updatePermissions(permissionsToSave);
      console.log('Permissions updated successfully');
      setAlertOpen(true);
    } catch (error) {
      console.error('Failed to update permissions', error);
    }
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const handleTaskCreated = () => {
    const fetchTasks = async () => {
      try {
        const tasksData = await getTasks();
        setTasks(tasksData.data);
      } catch (error) {
        console.error('Failed to fetch tasks', error);
      }
    };
    fetchTasks();
  };

  if (loading) {
    return <CircularProgress />;
  }

  return (
    <div className="role-mapping-container">
      <RoleActions
        setRoles={setRoles}
        setModules={setModules}
        setPermissions={setPermissions}
        roles={roles}
        tasks={tasks}
        modules={modules}
        setTasks={setTasks}
      />
      <RoleTable
        roles={roles}
        tasks={tasks}
        permissions={permissions}
        handleCheckBox={handleCheckBox}
      />

      <Button variant="contained" onClick={handleSaveChanges} className="save-button">
        Save Changes
      </Button>

      <AddTaskDialog
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        modules={modules}
        roles={roles}
        setTasks={setTasks}
        setPermissions={setPermissions}
        onTaskCreated={handleTaskCreated} 
      />

      <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
        <Alert onClose={handleAlertClose} severity="success" sx={{ width: '100%' }}>
          Role updates saved successfully!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RoleMapping;
