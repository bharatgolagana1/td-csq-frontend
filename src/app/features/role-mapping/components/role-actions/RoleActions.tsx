import React, { useState } from 'react';
import { Button, Alert, Snackbar } from '@mui/material';
import './RoleActions.css';
import { createModule, createRole, getTasks } from '../../api/RoleMappingAPI';
import { Role, Module, Permission, Task } from '../../RoleTypes';
import AddTaskDialog from '../add-task-dialog/AddTaskDialog';

interface RoleActionsProps {
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  setModules: React.Dispatch<React.SetStateAction<Module[]>>;
  setPermissions: React.Dispatch<React.SetStateAction<Permission[]>>;
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  roles: Role[];
  tasks: Task[];
  modules: Module[];
}

const RoleActions: React.FC<RoleActionsProps> = ({
  setRoles,
  setModules,
  setPermissions,
  setTasks,
  roles,
  tasks,
  modules,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const handleNewRole = async (): Promise<void> => {
    const name = prompt('Please enter new role name:');
    if (name?.trim()) {
      try {
        const response = await createRole({ name });
        const newRole: Role = {
          id: response.data._id,
          name: response.data.name,
          _id: response.data._id,
        };

        setRoles((prevRoles) => [...prevRoles, newRole]);

        const newPermissions: Permission[] = tasks.map((task) => ({
          id: `${newRole._id}_${task._id}`,
          roleId: newRole._id,
          taskId: task._id,
          enable: false,
        }));

        setPermissions((prevPermissions) => [...prevPermissions, ...newPermissions]);

        setAlertMessage('Role created successfully');
        setAlertSeverity('success');
      } catch (error) {
        console.error('Failed to create role', error);
        setAlertMessage('Failed to create role');
        setAlertSeverity('error');
      } finally {
        setOpenSnackbar(true);
      }
    }
  };

  const handleNewModule = async (): Promise<void> => {
    const name = prompt('Please enter new module name:');
    if (name?.trim()) {
      try {
        const response = await createModule({
          name,
          value: name.toLowerCase(),
        });

        const newModule: Module = {
          id: response.data.id,
          name: response.data.name,
          value: response.data.value,
          _id: response.data._id,
        };

        setModules((prevModules) => [...prevModules, newModule]);

        setAlertMessage('Module created successfully');
        setAlertSeverity('success');
      } catch (error) {
        console.error('Failed to create module', error);
        setAlertMessage('Failed to create module');
        setAlertSeverity('error');
      } finally {
        setOpenSnackbar(true);
      }
    }
  };

  const handleNewTask = (): void => {
    setIsModalOpen(true);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const refetchTasks = async () => {
    try {
      const response = await getTasks();
      setTasks(response.data);
      setAlertMessage('Task created successfully');
      setAlertSeverity('success');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Failed to fetch tasks', error);
    }
  };

  return (
    <div className="role-actions-box">
      <Button
        variant="outlined"
        onClick={handleNewRole}
        className="role-action-btn"
      >
        Add New Role
      </Button>
      <Button
        variant="outlined"
        onClick={handleNewModule}
        className="role-action-btn"
      >
        Add New Module
      </Button>
      <Button
        variant="outlined"
        onClick={handleNewTask}
        className="role-action-btn"
      >
        Add New Task
      </Button>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={alertSeverity}>
          {alertMessage}
        </Alert>
      </Snackbar>

      {isModalOpen && (
        <AddTaskDialog
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          modules={modules}
          roles={roles}
          setTasks={setTasks}
          setPermissions={setPermissions}
          onTaskCreated={refetchTasks} // Pass the refetch function
        />
      )}
    </div>
  );
};

export default RoleActions;